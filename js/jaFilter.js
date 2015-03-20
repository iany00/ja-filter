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
            events        : 'change',
            containerId   : null,
            rows          : null,
            noRecount     : null,
            activeFilters : [],
            filtersInDepth: [],
            countInDepth  : [],
            otherFilters  : [],
            jaAttribute   : 'jafilter',
            notInRange    : 'notInFilterRange',
            hideOnlyAvailableData : false,
            callback      : function (e)
            {
                //
            },
            done          : function (success)
            {
                //
            }
        },
        filters = {
            filter                  : function (options)
            {
                var notInRange = options.notInRange,
                    success = true,
                    callback = options.callback;

                options.activeFilters = $.extend ({}, options.activeFilters);

                options.$rows
                    .filter (function ()
                {
                    var itemRow = $ (this);
                    var itemData = $ (this).data ();
                    var inFilterRange = true;

                    $.each (options.activeFilters, function (key, value)
                    {
                        /*
                         * if not in filter range, stop & hide the item
                         * */
                        if (options.filtersInDepth.length > 0 && $.inArray (key, options.filtersInDepth) != -1) // depth filters
                        {
                            inFilterRange = filters.depthFilter (itemRow, key, options);
                            if (!inFilterRange)
                            {
                                return false;
                            }
                        }
                        else
                        {
                            if (options.activeFilters[key].length > 0)
                            {
                                if(typeof itemData[key] == "undefined" && options.hideOnlyAvailableData)
                                {
                                    inFilterRange = true;
                                }
                                else
                                if ($.inArray (itemData[key], value) == -1)
                                {
                                    inFilterRange = false;
                                    return false;
                                }
                                else
                                {
                                    inFilterRange = true;
                                }
                            }
                        }
                    });

                    // Add extra filters
                    if (options.otherFilters.length > 0)
                    {
                        if (typeof options.otherFilters === 'string')
                        {
                            options.otherFilters = [options.otherFilters];
                        }

                        $.each (options.otherFilters, function (key,_filter)
                        {
                            _filter.apply (this, [itemRow]);
                        });

                    }

                    if (!inFilterRange)
                    {
                        return true;
                    }
                    $ (this).removeClass (notInRange);

                }).addClass (notInRange);

                this.countAttributesForFilter (options, 'onfilter');

                return success;

            },
            depthFilter             : function (itemRow, dataAttr, options)
            {
                var notInRange = options.notInRange;
                var inFilterRange = true;

                itemRow.find ('[data-' + dataAttr + ']').each (function ()
                {

                    var $this = $ (this);
                    var thisData = $this.data (dataAttr);

                    if (options.activeFilters[dataAttr].length == 0) // When filter is selected
                    {
                        $this.removeClass (notInRange);
                        inFilterRange = true;
                    }
                    else if ($.inArray (thisData, options.activeFilters[dataAttr]) == -1)
                    {
                        $this.addClass (notInRange);
                    }
                    else
                    {
                        $this.removeClass (notInRange);
                        inFilterRange = true;
                    }
                });

                return inFilterRange;
            },
            countAttributesForFilter: function (options, action)
            {
                // Count data
                var categoriesCnt = [];
                options.$rows.not ('.' + options.notInRange).each (function ()
                {
                    var $thisRow = $ (this);
                    var thisData = $ (this).data ();
                    $.each (thisData, function (key, value)
                    {
                        if (typeof categoriesCnt[key] == "undefined")
                        {
                            categoriesCnt[key] = [];
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
                        $.each (options.countInDepth, function (key, dataAttr)
                        {
                            $thisRow.find ('[data-' + dataAttr + ']').not ('.' + options.notInRange).each (function ()
                            {
                                var value = $ (this).data (dataAttr);
                                if (typeof categoriesCnt[dataAttr] == "undefined")
                                {
                                    categoriesCnt[dataAttr] = [];
                                }
                                if (typeof categoriesCnt[dataAttr][value] != "undefined")
                                {
                                    categoriesCnt[dataAttr][value] += 1;
                                }
                                else
                                {
                                    categoriesCnt[dataAttr][value] = 1;
                                }
                            });
                        });

                    }

                });

                if (typeof  options.noRecount === 'string')
                {
                    options.noRecount = [options.noRecount];
                }

                // Set counted data
                options.$selector.find ('[type="checkbox"]').each (function ()
                {
                    var attr = $ (this).data (options.jaAttribute);

                    if ($.inArray (attr, options.noRecount) != -1 && action != 'init')
                    {
                        // do nothing ..
                    }
                    else
                    {
                        var value = $ (this).val ();
                        var cnt;

                        if (typeof categoriesCnt[attr] == "undefined" || typeof categoriesCnt[attr][value] == "undefined")
                        {
                            cnt = 0;
                        }
                        else
                        {
                            cnt = categoriesCnt[attr][value];
                        }

                        $ (this).next ().text (cnt);
                    }
                });


            }
        },
        methods = {
            make   : function (options)
            {

                if (options === 'undefined')
                {
                    $.error ('jQuery' + namespace + ' may not be initialized without options.');
                }

                options = $.extend ({}, defaults, options);
                options.events = options.events.replace (/(\w+)/g, "$1" + namespace + " ");

                var html = '<style type = "text/css">.' + options.notInRange + '{display:none!important;}</style>';
                $(html).appendTo("head");

                if (typeof options.filtersInDepth === 'string')
                {
                    options.filtersInDepth = [options.filtersInDepth];
                }

                if (typeof options.countInDepth === 'string')
                {
                    options.countInDepth = [options.countInDepth];
                }


                /*******/
                this.each (function ()
                {

                    // Cache selectors
                    options.$selector = $ (this);
                    options.$containerId = $ (options.containerId);
                    options.$rows = $ (options.containerId).find (options.rows);

                    // Creat active filter array
                    $ (this).find ('[type="checkbox"]').each (function ()
                    {
                        var attr = $ (this).data (options.jaAttribute);
                        options.activeFilters[attr] = [];
                    });

                    filters.countAttributesForFilter (options, 'init');

                    $ (this).find ('[type="checkbox"]').on (options.events, function ()
                    {

                        var success;

                        // Get data attr and value
                        var filterAttributes = $ (this).data (options.jaAttribute);
                        var filterValue = parseInt ($ (this).val ());


                        // Create active filters
                        if ($ (this).is (':checked'))
                        {
                            options.activeFilters[filterAttributes].push (filterValue);

                        }
                        else
                        {
                            var arrIndex = $.inArray( filterValue, options.activeFilters[filterAttributes] );
                            options.activeFilters[filterAttributes].splice (arrIndex, 1);
                        }

                        success = filters.filter (options);

                        if (options.done)
                        {
                            options.done (success);
                        }

                    });

                });

                return this;

            },
            destroy: function ()
            {

                this.each (function ()
                {

                    $ (this).off (namespace);

                });

                return this;

            }

        };


    $.fn.jaFilter = function (method)
    {

        if (methods[method])
        {
            return methods[method].apply (this, Array.prototype.slice.call (arguments, 1));
        }
        else if (typeof method === 'object' || !method)
        {
            return methods.make.apply (this, arguments);
        }
        else
        {
            $.error ('Method ' + method + ' does not exist on jQuery' + namespace);
        }

        return this;
    };

} (jQuery));