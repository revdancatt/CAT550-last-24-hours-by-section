control = {

  sections: [],
  sectionsJSON: {},
  total: 0,

  
  init: function() {
    
    $('#currentaction h1').html('Fetching sections file');


    //  I know getting the date for today is easy, but I want to know what
    //  the Guardian thinks the date is, and I'll do this by getting the most recent
    //  article and then we can work it out from that
    $.getJSON("http://content.guardianapis.com/sections?format=json&callback=?",
      //  TODO: add error checking to this response
      function(json) {

        for (var i in json.response.results) {
          try {
            control.sections.push(json.response.results[i].id);
            control.sectionsJSON[json.response.results[i].id] = {'id': json.response.results[i].id, 'done': false, 'score': 0, 'webTitle': json.response.results[i].webTitle};
          } catch(er) {
            // do nowt
          }
        }

        control.getValues();

      }
    );

  },

  getValues: function() {

    //  run thru the list finding out how many we have already done
    //  and how many more we need to fetch
    var done = 0;
    var needToDo = 0;
    var doThisSection = null;

    for (var i in control.sections) {
      if (control.sectionsJSON[control.sections[i]].done === false) {
        doThisSection = control.sectionsJSON[control.sections[i]];
        needToDo++;
      } else {
        done++;
      }
    }

    if (doThisSection !== null) {
      $('#currentaction h1').html('Fetching section value');
      $('#currentaction h4').html((done+1) + '/' + (needToDo + done) + ' : ' + doThisSection.webTitle);

      $.getJSON("http://content.guardianapis.com/search?section=" + doThisSection.id + "&page-size=1&format=json&date-id=date%2Flast24hours&callback=?",
        //  TODO: add error checking to this response
        function(json) {

          control.sectionsJSON[doThisSection.id].done = true;
          control.sectionsJSON[doThisSection.id].score = json.response.total;
          control.total+=json.response.total;
          control.getValues();
        }
      );
    } else {
      $('#currentaction h1').html('Done');
      $('#currentaction h4').html('');
      $('#currentaction').delay(3000).slideUp('slow');

      control.showValues();
    }


  },

  showValues: function() {

    //  Build up the table we need to show the results.
    var tbl1 = $('<table>').attr('id', 'tb1').addClass("table table-striped table-bordered table-condensed");
    var tbl2 = $('<table>').attr('id', 'tb2').addClass("table table-striped table-bordered table-condensed");
    tbl1.append($('<thead>').append($('<tr>').append($('<th>').html('Section')).append($('<th>').html('Published'))));
    tbl2.append($('<thead>').append($('<tr>').append($('<th>').html('Section')).append($('<th>').html('Published'))));
    
    control.sections.sort();
    var data = [];

    var sortThis = [];
    for (var item in control.sectionsJSON) {
      sortThis.push(control.sectionsJSON[item]);
    }

    sortThis.sort(function(a, b){
      return a.score-b.score;
    });
    sortThis.reverse();

    control.sections = [];
    for (var index in sortThis) {
      control.sections.push(sortThis[index].id);
    }

    for (var i in control.sections) {
      if (control.sectionsJSON[control.sections[i]].score > 0) {
        tbl1.append($('<tr>').append($('<td>').html(control.sectionsJSON[control.sections[i]].webTitle)).append($('<td>').html(control.sectionsJSON[control.sections[i]].score)));
        data.push({label: control.sectionsJSON[control.sections[i]].webTitle, data: control.sectionsJSON[control.sections[i]].score});
      }
      tbl2.append($('<tr>').append($('<td>').html(control.sectionsJSON[control.sections[i]].webTitle)).append($('<td>').html(control.sectionsJSON[control.sections[i]].score)));
    }

    $('#table1').append(tbl1).css('display', 'none').removeClass('hidden').fadeIn('fast');
    $('#table2').append(tbl2).css('display', 'none').removeClass('hidden').fadeIn('fast');

    $('#table1').append($('<h4>').html('total: ' + control.total));

    $.plot($("#default"), data,
    {
      series: {
          pie: {
              show: true
          }
      },
      legend: {
          show: false
      }
    });
    $('#pie').css('display', 'none').removeClass('hidden').fadeIn('fast');


  }

};

utils = {
  
  log: function(msg) {
    try {
      console.log(msg);
    } catch(er) {
      
    }
  }
};
