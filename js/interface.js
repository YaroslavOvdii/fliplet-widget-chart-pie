var data = Fliplet.Widget.getData() || {
  dataSourceQuery: undefined,
  showDataLegend: true,
  showDataValues: true,
  showTotalEntries: '',
  autoRefresh: ''
};

var dsQueryData = {
  settings: {
    dataSourceLabel: 'Select a data source',
    modesDescription: 'How do you want your data to be plotted?',
    modes: [
      {
        label: 'Plot my data as it is',
        filters: false,
        columns: [
          {
            key: 'category',
            label: 'Select the column with the categories',
            type: 'single'
          },
          {
            key: 'value',
            label: 'Select the column with the values',
            type: 'single'
          }
        ]
      },
      {
        label: 'Summarise my data',
        filters: false,
        columns: [
          {
            key: 'column',
            label: 'Select a column',
            type: 'single'
          }
        ]
      }
    ]
  },
  result: data.dataSourceQuery
};

var dsQueryProvider = Fliplet.Widget.open('com.fliplet.data-source-query', {
  selector: '.data-source-query',
  data: dsQueryData
});

dsQueryProvider.then(function(result){
  Fliplet.Widget.save({
    dataSourceQuery: result.data,
    showDataLegend: $('#show_data_legend:checked').val() === "show",
    showDataValues: $('#show_data_values:checked').val() === "show",
    showTotalEntries: $('#show_total_entries:checked').val() === "show",
    autoRefresh: $('#auto_refresh:checked').val() === "refresh"
  }).then(function () {
    Fliplet.Widget.complete();
    Fliplet.Studio.emit('reload-page-preview');
  });
});

// Fired from Fliplet Studio when the external save button is clicked
Fliplet.Widget.onSaveRequest(function () {
  dsQueryProvider.forwardSaveRequest();
});

// LOAD CHART SETTINGS
if (data) {
  $('#show_data_legend').prop('checked', data.showDataLegend);
  $('#show_data_values').prop('checked', data.showDataValues);
  $('#show_total_entries').prop('checked', data.showTotalEntries);
  $('#auto_refresh').prop('checked', data.autoRefresh);
}
