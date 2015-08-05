/**
 *
 * Copyright (c) 2015 Ionut Airinei
 *
 * Content filtering - jaFilter
 *
 * documentation at https://github.com/iany00/ja-filter
 *
 * allows content divs to be filtered (made invisible) under a specific format
 * <code>
 *      $('#filter').jaFilter({
 *       containerId     : '#container',
 *       rows            : '.result_row',
 *   });
 * </code>
 */

(function ($)
{
    "use strict";

    var namespace = '.jaFilter',
        defaults = {
            events               : 'change',
            containerId          : null,
            rows                 : null, // string; class name
            neverRecount         : null, // array; don\t recount elements on specific categories
            categoryRecount      : true, // boolean; recount elements on selected category
            noEmptyFilters       : true,
            visibleFilters       : [],
            filtersInDepth       : [],
            countInDepth         : [],
            extraFilters         : [],
            jaAttribute          : 'jafilter',
            notInRange           : 'notInFilterRange',
            hideOnlyAvailableData: false,

            // * Do not change this
            activeFilters        : [],
            filterCounter        : [],
            visibleRows          : 0,
            onClickCategory      : null,
            before               : function(e)
            {
                //
            },
            callback             : function (e)
            {
                //
            },
            done                 : function (success)
            {
                //
            }
        },
        filters = {
            filter                  : function (options)
            {
                // Filter options and defaults
                var notInRange = options.notInRange,
                    success     = true,
                    callback    = options.callback;

                defaults.visibleRows = 0;
                options.activeFilters = $.extend({}, options.activeFilters);

                /* ==========================================
                * Here we apply filters for each selected items
                * Depth & Extra filter are applied if they are set
                * Attribute counter starts after all filters are applied
                * ==========================================
                * */
                options.$rows.filter(function ()
                {
                    var itemRow  = $(this);
                    var itemData = $(this).data();
                    var inFilterRange = true;

                    // if not in filter range, stop & hide the item
                    $.each(options.activeFilters, function (key, value)
                    {
                        if (options.filtersInDepth.length > 0 && $.inArray(key, options.filtersInDepth) != -1) // depth filters
                        {
                            inFilterRange = filters.depthFilter(itemRow, key, options);
                            if (!inFilterRange)
                            {
                                return false;
                            }
                        }
                        else
                        {
                            if (options.activeFilters[key].length > 0)
                            {
                                if (typeof itemData[key] == "undefined" && options.hideOnlyAvailableData)
                                {
                                    inFilterRange = true;
                                }

                                // in case we have data with multiple values use split
                                var arrData = [];
                                if(typeof itemData[key] === 'string')
                                {
                                    arrData = itemData[key].split(",").map(function (e) {
                                        var intValue = parseInt(e, 10);
                                        return (isNaN(intValue) ? e : intValue);
                                    });
                                    inFilterRange = false;
                                    $.each(value, function(k, v) {
                                        if(arrData.indexOf(v) != -1)
                                        {
                                            inFilterRange = true;
                                            return false;
                                        }
                                    });
                                    return inFilterRange;
                                } else {
                                    if ($.inArray(itemData[key], value) == -1)
                                    {
                                        inFilterRange = false;
                                        return false;
                                    } else {
                                        inFilterRange = true;
                                    }
                                }
                            }
                        }
                    });

                    // Add extra filters
                    /*
                     ===  Do not execute extra filters if element failed in previous filter ===
                    */
                    if (options.extraFilters.length > 0 && inFilterRange)
                    {
                        if (typeof options.extraFilters === 'string')
                        {
                            options.extraFilters = [options.extraFilters];
                        }

                        $.each(options.extraFilters, function (key, _filter)
                        {
                            var found = _filter.apply(this, [itemRow]);
                            if(!found)
                            {
                                inFilterRange = found;
                            }
                        });
                    }

                    if (!inFilterRange)
                    {
                        return true;
                    }

                    $(this).removeClass(notInRange);

                    defaults.visibleRows++;

                }).addClass(notInRange);

                //callback(this, success, options);

                this.countAttributesForFilter(options, 'onfilter');

                return success;

            },
            depthFilter             : function (itemRow, dataAttr, options)
            {
                var notInRange = options.notInRange;
                var inFilterRange = false;

                itemRow.find('[data-' + dataAttr + ']').each(function ()
                {
                    var $this = $(this);

                    var dataAttrC = dataAttr.replace('\\',''); //*fix for data at using dot*/
                    var thisData = $this.data(dataAttrC);

                    if (options.activeFilters[dataAttr].length == 0) // When filter is selected
                    {
                        $this.removeClass(notInRange);
                        inFilterRange = true;
                    }
                    else if ($.inArray(thisData, options.activeFilters[dataAttr]) == -1)
                    {
                        $this.addClass(notInRange);
                    }
                    else
                    {
                        $this.removeClass(notInRange);
                        inFilterRange = true;
                    }
                });

                return inFilterRange;
            },
            countAttributesForFilter: function (options, action)
            {
                // Count data
                var categoriesCnt = {};
                options.$rows.not('.' + options.notInRange).each(function ()
                {
                    var $thisRow = $(this);
                    var thisData = $(this).data();
                    $.each(thisData, function (key, value)
                    {
                        if (typeof categoriesCnt[key] == "undefined")
                        {
                            categoriesCnt[key] = {};
                        }
                        if (typeof categoriesCnt[key][value] != "undefined")
                        {
                            categoriesCnt[key][value] += 1;
                        }
                        else
                        {
                            categoriesCnt[key][value] = 1;
                        }
                    });


                    if (options.countInDepth.length > 0)
                    {
                        $.each(options.countInDepth, function (key, dataAttr)
                        {
                            $thisRow.find('[data-' + dataAttr + ']').not('.' + options.notInRange).each(function ()
                            {
                                var dataAttrC = dataAttr.replace('\\',''); //*---*/
                                var value = $(this).data(dataAttrC);
                                if (typeof categoriesCnt[dataAttr] == "undefined")
                                {
                                    categoriesCnt[dataAttr] = {};
                                }
                                if (typeof categoriesCnt[dataAttr][value] != "undefined" && value != 0 && value != '')
                                {
                                    categoriesCnt[dataAttr][value] += 1;
                                }
                                else if(value != 0 && value != '')
                                {
                                    categoriesCnt[dataAttr][value] = 1;
                                }
                            });
                        });
                    }
                });

                defaults.filterCounter = categoriesCnt;

                filters.setAttributeCount(categoriesCnt, action);
            },
            setAttributeCount: function(categoriesCnt, action)
            {
                var options = defaults;
                if (typeof  options.neverRecount === 'string')
                {
                    options.neverRecount = [options.neverRecount];
                }

                // Set counted data
                options.$selector.find('[type="checkbox"]').each(function ()
                {
                    var attr = $(this).data(options.jaAttribute);

                    /*Add filter counter*/
                    if ((action != 'init' && options.neverRecount != null && $.inArray(attr, options.neverRecount) != -1 )
                            || (options.categoryRecount === true && options.onClickCategory == attr))
                    {
                        // do nothing??
                    }
                    else
                    {
                        var value = $(this).val();
                        var cnt;

                        if (typeof categoriesCnt[attr] === "undefined" || typeof categoriesCnt[attr][value] === "undefined") {
                            cnt = 0;
                        }
                        else {
                            cnt = categoriesCnt[attr][value];
                        }

                        var $labelFor = options.$selector.find('[for="' + $(this).attr('id') + '"]');
                        if (typeof $labelFor === "undefined")
                        {   // Add counter in next tag
                            $(this).next().text(cnt);
                        }
                        else
                        {   // Add the counter in label based on input id
                            $labelFor.find('span').text(cnt);
                        }

                        // Hide filters that has 0 counted elements
                        if($.isArray(options.noEmptyFilters)
                            && $.inArray(attr, options.noEmptyFilters) != -1
                            && cnt == 0
                            || options.noEmptyFilters == false)
                        {
                            $(this).parent().hide();
                            $labelFor.hide();
                            $labelFor.next().hide();
                        }
                        else { // or show them
                            $labelFor.show();
                            $(this).parent().show();
                            $labelFor.next().show();
                        }

                        // Exceptions
                        if(options.visibleFilters.length > 0 && $.inArray(attr, options.visibleFilters) != -1)
                        {
                            $labelFor.show();
                            $(this).parent().show();
                            $labelFor.next().show();
                        }
                    }
                });
            }
        },
        methods = {
            make       : function (options)
            {
                /* === Filter options ===*/
                if (options === 'undefined')
                {
                    $.error('jQuery' + namespace + ' may not be initialized without options.');
                }

                defaults = $.extend({}, defaults, options);
                defaults.events = defaults.events.replace(/(\w+)/g, "$1" + namespace + " ");

                var html = '<style type = "text/css">.' + defaults.notInRange + '{display:none!important;}</style>';
                $(html).appendTo("head");

                if (typeof defaults.filtersInDepth === 'string')
                {
                    defaults.filtersInDepth = [defaults.filtersInDepth];
                }

                if (typeof defaults.countInDepth === 'string')
                {
                    defaults.countInDepth = [defaults.countInDepth];
                }

                // Cache selectors
                defaults.$containerId = $(defaults.containerId);
                defaults.$rows        = $(defaults.containerId).find(defaults.rows);

                /* === Filter events init ===*/
                this.each(function () // in case of multiple filters
                {
                    defaults.$selector       = $(this);
                    defaults.checkboxFilters = $(this).find('[type="checkbox"]');

                    // Create active filter array
                    $(this).find('[type="checkbox"]').each(function ()
                    {
                        var attr = $(this).data(defaults.jaAttribute);
                        defaults.activeFilters[attr] = [];
                    });

                    // Set cache
                    methods.setCache(defaults);

                    filters.countAttributesForFilter(defaults, 'init');

                    // start to filter on event
                    defaults.checkboxFilters.on(defaults.events, function ()
                    {
                        if(defaults.before) {
                            defaults.before();
                        }

                        var success;

                        // flag the checked category
                        if($(this).is(':checked')) {
                            defaults.onClickCategory = $(this).data(defaults.jaAttribute);
                        }

                        // Set active filters
                        defaults = methods.setActiveFilters(this, defaults);

                        success = filters.filter(defaults);

                        if (defaults.done)
                        {
                            defaults.onClickCategory = null;
                            defaults.done(success);
                        }

                    });

                });


                return this;

            },
            setActiveFilters: function(that, options)
            {
                // Get data attr and value
                var filterAttributes = $(that).data(options.jaAttribute);
                var thisValue        = $(that).val();
                var filterValue      = (isNaN(parseInt(thisValue, 10)) ? thisValue : parseInt(thisValue, 10));

                // Create active filters
                if (typeof filterAttributes !== "undefined")
                {
                    if ($(that).is(':checked'))
                    {
                        options.activeFilters[filterAttributes].push(filterValue);
                    }
                    else
                    {
                        var arrIndex = $.inArray(filterValue, options.activeFilters[filterAttributes]);
                        if (arrIndex > -1)
                        {
                            options.activeFilters[filterAttributes].splice(arrIndex, 1);
                        }

                    }
                }

                return options;
            },
            resetCache : function ()
            {
                defaults.$containerId = $(defaults.containerId);
                defaults.$rows        = $(defaults.containerId).find(defaults.rows);
            },
            /*=== Get Cache ===*/
            getCache: function (resetCache)
            {
                if(resetCache || typeof resetCache === "undefined")
                    methods.resetCache();

                return defaults;
            },
            setCache: function (options)
            {
                defaults = $.extend({}, defaults, options);
            },
            recount    : function ()
            {
                methods.resetCache();
                filters.countAttributesForFilter(defaults, 'onfilter');
            },
            setFilterCount: function (categoriesCnt)
            {
                filters.setAttributeCount(categoriesCnt,'onfilter');
            },
            restartFilter : function()
            {
                var options = defaults;
                defaults.checkboxFilters.each(function ()
                {
                    // Set active filters
                    options = methods.setActiveFilters(this, defaults);
                });

                var success = filters.filter(options);

                if (options.done)
                {
                    options.done(success);
                }
            },
            destroy    : function ()
            {
                this.each(function ()
                {
                    $(this).off(namespace);
                });

                return this;
            }
        };


    $.fn.jaFilter = function (method)
    {
        if (methods[method])
        {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }
        else if (typeof method === 'object' || !method)
        {
            return methods.make.apply(this, arguments);
        }
        else
        {
            $.error('Method ' + method + ' does not exist on jQuery' + namespace);
        }

        return this;
    };

}(jQuery));