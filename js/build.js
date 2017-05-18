window.ui = window.ui || {}
ui.flipletCharts = {};
function init(){
  Fliplet.then(function(){
    $('[data-chart-pie-id]').each(function (i, el) {
      var chartId = $(this).data('chart-pie-id');
      var data = Fliplet.Widget.getData( chartId );
      var $container = $(el);
      var refreshTimeout = 5000;
      // var updateDateFormat = 'MMMM Do YYYY, h:mm:ss a';
      var updateDateFormat = 'hh:mm:ss a';

      function resetData() {
        data.entries = [];
        data.totalEntries = 0;
      }

      function refreshData() {
        return Fliplet.DataSources.fetchWithOptions(data.dataSourceQuery).then(function(result){
          var columns = [];
          data.entries = [];
          data.totalEntries = 0;
          if (!result.dataSource.columns.length) {
            return Promise.resolve();
          }
          switch (data.dataSourceQuery.selectedModeIdx) {
            case 0:
            default:
              result.dataSourceEntries.forEach(function(row, i) {
                data.entries.push({
                  name: row[data.dataSourceQuery.columns.category] || 'Category ' + (i+1),
                  y: parseInt(row[data.dataSourceQuery.columns.value]) || 0
                });
              });
              break;
            case 1:
              result.dataSourceEntries.forEach(function(row) {
                var value = row[data.dataSourceQuery.columns.column];
                value = $.trim(value);

                if (value.constructor.name !== 'Array') {
                  value = [value];
                }
                // Value is an array
                value.forEach(function(elem) {
                  if ( columns.indexOf(elem) === -1 ) {
                    columns.push(elem);
                    data.entries[columns.indexOf(elem)] = {
                      name: elem,
                      y: 1
                    };
                  } else {
                    data.entries[columns.indexOf(elem)].y++;
                  }
                });
              });
              break;
          }
          data.entries = _.reverse(_.sortBy(data.entries, function(o){
            return o.y;
          }));
          if (data.entries.length) {
            data.entries[0].sliced = true;
            data.entries[0].selected = true;
          }

          // SAVES THE TOTAL NUMBER OF ROW/ENTRIES
          data.totalEntries = _.reduce(data.entries, function(sum, o){
            return sum + o.y;
          }, 0);

          return Promise.resolve();
        });
      }

      function refreshChartInfo() {
        // Update total count
        $container.find('.total').html(data.totalEntries);
        // Update last updated time
        $container.find('.updatedAt').html(moment().format(updateDateFormat));
      }

      function refreshChart() {
        // Retrieve chart object
        var chart = ui.flipletCharts[chartId];
        // Update values
        chart.series[0].setData(data.entries);
        refreshChartInfo();
      }

      function getLatestData() {
        setTimeout(function(){
          refreshData().then(function(){
            refreshChart();
            if (data.autoRefresh) {
              getLatestData();
            }
          });
        }, refreshTimeout);
      }

      function drawChart() {
        var colors = [
          '#337AB7', '#5BC0DE', '#5CB85C', '#F0AD4E', '#C9302C',
          '#293954', '#2E6F82', '#3D7A3D', '#B07623', '#963732'
        ];
        colors.forEach(function eachColor (color, index) {
          if (!Fliplet.Themes.Current) {
            return;
          }
          colors[index] = Fliplet.Themes.Current.get('chartColor'+(index+1)) || color;
        });
        var chartOpt = {
          chart: {
            type: 'pie',
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            renderTo: $container.find('.chart-pie-container')[0],
            style: {
              fontFamily: Fliplet.Themes.Current.get('bodyFontFamily') || 'sans-serif'
            },
            events: {
              load: function(){
                refreshChartInfo();
                if (data.autoRefresh) {
                  getLatestData();
                }
              }
            }
          },
          colors: colors,
          title: {
            text: ''
          },
          subtitle: {
            text: ''
          },
          tooltip: {
            pointFormat: '<strong>{point.percentage:.1f}%</strong> '
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: data.showDataValues,
                format: [
                  (!data.showDataLegend ? '<strong>{point.name}</strong>: ' : ''),
                  '{point.percentage:.1f} %'
                ].join(''),
                style: {
                  color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
              },
              showInLegend: data.showDataLegend
            }
          },
          series: [{
            name: (data.dataSourceQuery.selectedModeIdx === 0)
              ? data.dataSourceQuery.columns.category
              : data.dataSourceQuery.columns.column,
            colorByPoint: true,
            innerSize: '0%',
            data: data.entries
          }],
          credits: {
            enabled: false
          }
        };
        // Create and save chart object
        ui.flipletCharts[chartId] = new Highcharts.Chart(chartOpt);
      }

      refreshData().then(drawChart);
    });
  });
}

var debounceLoad = _.debounce(init, 500);

Fliplet.Studio.onEvent(function (event) {
  if (event.detail.event === 'reload-widget-instance') {
    debounceLoad();
  }
});
init();
