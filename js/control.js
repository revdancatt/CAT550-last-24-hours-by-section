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
          utils.log(json.response.results[i].id);
          control.sections.push(json.response.results[i].id);
          control.sectionsJSON[json.response.results[i].id] = {'id': json.response.results[i].id, 'done': false, 'score': 0, 'webTitle': json.response.results[i].webTitle};
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
      $('#currentaction h4').html(doThisSection.webTitle + ': ' + (done+1) + '/' + (needToDo + done));

      $.getJSON("http://content.guardianapis.com/search?section=" + doThisSection.id + "&page-size=1&format=json&date-id=date%2Flast24hours&callback=?",
        //  TODO: add error checking to this response
        function(json) {

          utils.log(doThisSection.id);
          utils.log(json);
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
    var tbl = $('<table>').addClass("table table-striped table-bordered table-condensed");
    tbl.append($('<thead>').append($('<tr>').append($('<th>').html('Section')).append($('<th>').html('Published'))));
    
    control.sections.sort();
    var data = [];
    for (var i in control.sections) {
      tbl.append($('<tr>').append($('<td>').html(control.sectionsJSON[control.sections[i]].webTitle)).append($('<td>').html(control.sectionsJSON[control.sections[i]].score)));
      data.push({label: control.sectionsJSON[control.sections[i]].webTitle, data: control.sectionsJSON[control.sections[i]].score});
    }

    $('#table').append(tbl);
    $('#table').css('display', 'none').removeClass('hidden').fadeIn('fast');

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

/*
  //  this is going to start at the first day and loop over until
  //  we've put all the dates at the top of each day column
  displayDates: function() {
    
    var d = null;
    for (var i = 0; i < 7; i++) {
      d = new Date(this.startOfWeek.getTime() + (1000*60*60*24*i));
      d = d.toString().split(' ');
      $($('#week .dayholder')[i]).children('h6').html(d[2] + ' ' + d[1]);
    }

  },

  fetchVideoFeed: function() {

    if (this.pages === null) {
      $('#currentaction h1').html('Counting ' + contenttype);
    } else {
      $('#currentaction h1').html('Counting ' + contenttype + ' ' + this.page + '/' + this.pages);
    }

    var fromdate = (control.startOfWeek.getYear() + 1900) + '-' + (control.startOfWeek.getMonth()+1) + '-' + control.startOfWeek.getDate();
    var todate = (control.endOfWeek.getYear() + 1900) + '-' + (control.endOfWeek.getMonth()+1) + '-' + control.endOfWeek.getDate();
    $.getJSON('http://content.guardianapis.com/search?page=' + control.page + '&tag=type/' + contenttype + '&from-date=' + fromdate + '&to-date=' + todate + '&show-tags=series&order-by=oldest&format=json&show-fields=shortUrl,thumbnail&callback=?',
      //  TODO: add error checking to this response
      function(json) {
        for (var i in json.response.results) {
          control.plotVideo(json.response.results[i]);
        }

        //  now we need to see if we should get another page
        control.pages = json.response.pages;
        if (control.page < control.pages) {
          control.page++;
          control.fetchVideoFeed();
        } else {
          if (json.response.total == 1) {
            $('#currentaction h1').html('Done, 1 video');
          } else {
            control.finishPlotting();
          }
        }

      }
    );


  },

  plotVideo: function(json) {
    
    //  Ok, now we want to get the publish date of each video, same as before...
    var d = json.webPublicationDate.split('T')[0].split('-');
    var dow = new Date(parseInt(d[0],10), parseInt(d[1],10)-1, parseInt(d[2],10));

    //  and the time, at some point timezones will get thrown into the mix
    //  we're just going to ignore that for the moment because timezones suck
    //  and they can mess around with the time (and we're not *that* fussed about
    //  being spot-on)
    d = json.webPublicationDate.split('T')[1].split('Z')[0].split(':');
    var tod = parseInt(d[0]*60,10) + parseInt(d[1],10);

    var todpos = 0;
    if (tod > 1200){
      todpos+=((tod-1200)/4)+(12*60)+(8*15);
    } else if (tod > 480) {
      todpos+=(tod-480)+(8*15);
    } else {
      todpos=parseInt(tod/4,10);
    }
    todpos+=15;

    //  Now we know the day and the time of day, we can add the thumbnail onto the page
    var th = $('<div>').addClass('thumbholder').addClass('section_' + json.sectionId).css('top', todpos-12);
    var dtime = $('<div>').addClass('time').addClass('tinyfont').html(d[0] + ':' + d[1]);
    var dsection = $('<div>').addClass('sectionname').addClass('tinyfont').html(json.sectionName);
    var i = $('<img>').addClass('thumbnail').attr('src', json.fields.thumbnail).attr('title', d[0] + ':' + d[1]);

    if (json.tags.length > 0) {
      var dseries = $('<div>').addClass('series').addClass('tinyfont').html('series');
      th.append(dseries);
    }

    th.append(dtime);
    th.append(i);
    th.append(dsection);

    $($('#week .dayholder')[dow.getDay()]).children('.fullday').append(th);
    i.attr('style', '');


  },

  finishPlotting: function() {
    $('#currentaction h1').html('Done');
    $('#currentaction').slideUp('slow');

    setTimeout(function() {
      $('.thumbnail').each(function(i, el) {
        if ($(el).css('display') == 'none') {
          $(el).parent().remove();
        }
      });
    }, 1000);

    $('#sectionFilters').fadeIn(666);
  }
*/
};

utils = {
  
  log: function(msg) {
    try {
      console.log(msg);
    } catch(er) {
      
    }
  }
};