#jQuery Content Filtering (jaFilter)
   - A jQuery plugin for content filtering

##Instructions

1. Include the latest version of jQuery
2. Include the plugin script
3. Instantiate the plugin on an element that contains a data & value attribute, and pass the elements you want to filter as the parameter. See the `filter.html, filter2.html` file for a simple example.


## usage


```javascript

$('#filter').jaFilter({
    containerId     : '#container',
    rows            : '.result_row'
    });
```

arguments:
```
   * containerId // Container id that has the elements you want to filter
   * rows       // Container class that has data attributes for filtering
```
optional arguments:
```
    * noRecount               // No recounts on specific data element(s); e.g noRecount:['filter1', 'filter2']
    * filtersInDepth          // In case you have sub-filters; see example "filter2.html"
    * countInDepth            // In case you have sub-filters; see example "filter2.html"
    * otherFilters            // In case you want to add a custom filter. see example "filter.html". This applies for each element
    * hideOnlyAvailableData   // Set this to true when some elements doesn't have a data for filtering set (or has a depth filter) and you want to show them
    * jaAttribute             // You can change the default data attribute 'jafilter'
    * notInRange              // You can change the default class for hidden elements 'notInFilterRange',
```
## Warning:

* expects filters to have data-jafilter=["FILTERNAME"] and value = ["FILTER_VALUE"]
* expects elements you want to filter to have data-[FILTERNAME] = ["FILTER_VALUE"]