String.prototype.trim = function() {
  return this.replace(/^\s*|\s*$/g, "");
};

function secondsToHms(d) {
  d = Number(d);
  var days = Math.floor(d / 86400)
  var h = Math.floor(d / 3600);
  var m = Math.floor(d % 3600 / 60);
  var s = Math.floor(d % 3600 % 60);
  
  if (days > 1){
      return days + ' days ago';
  }
  else if (days == 1){
      return days + ' day ago';
  }
  else if (h > 1){
      return h + ' hours ago';
  }
  else if (h == 1){
      return h + ' hour ago';
  }
  else if (m > 1){
      return m + ' minutes ago';
  }
  else if (m == 1){
      return m + ' minute ago';
  }
  else if (s >= 10){
      return s + ' seconds ago';
  }
  else{
      return 'Right now';
  }
}

(function(){
  var self = { };
  var m_ = { };
  
  // Private Attributes
  m_.window_height = 0;
  m_.window_width = 0;
  m_.janky_drawer_offest = 0;
  m_.janky_wrap = null;
  m_.janky_content = null;
  m_.janky_drawer_toggle = null;
  m_.janky_drawer_shown = false;
  m_.janky_initial_render = false;
  m_.jenkins_builds_cont = null;
  m_.janky_build_interval = null;
  m_.janky_build_map = { };
  m_.jenkins_data = { };

  m_.init = function(){
    m_.janky_fixed = $('#janky_fixed');
    m_.janky_wrap = $('#janky_wrap');
    m_.janky_content = $('#janky_content');
    m_.janky_drawer_toggle = $('#janky_fixed #janky_drawer_toggle');
    m_.jenkins_builds_cont = $('#executors');

    m_.update_janky_sizes();

    m_.janky_fixed.css({
      'bottom': -(m_.window_height)
    });

    // Attach drawer toggle
    m_.janky_drawer_toggle.bind('click', m_.toggle_janky_drawer);

    $(window).bind('resize', m_.update_janky_sizes);

    m_.get_jenkins_feed();
    m_.janky_fixed.show();
    m_.render_janky_feed();

    // Poll builds container for new builds
    clearInterval(m_.janky_build_interval);
    m_.janky_build_interval = setInterval(function(){
      m_.build_change();
    }, 500);
  };

  // Public Methods

  self.update_janky_feed = function(){
    m_.jenkins_data = { };
    m_.get_jenkins_feed();
  };

  // Private Methods

  m_.update_janky_builds = function(build){
    console.log(build);
  };

  m_.build_change = function(e){
    if ($('#executors').find('table.progress-bar')){
      var rows = $('#executors > tbody:last > tr');
      var build = '';
      var progress = 0;
      var progress_cont = null;

      rows.each(function(i){
        if ($(this).find('table.progress-bar').length > 0){
          build = $(this).find('a:first').text();
          progress = $(this).find('td.progress-bar-done').css('width').replace('px', '');

          if (typeof(m_.janky_build_map[build]) == "undefined"){
            m_.janky_build_map[build] = {
              title: build,
              progress: progress
            };
          }
          else if (m_.janky_build_map[build].progress != progress){
            m_.janky_build_map[build] = {
              title: build,
              progress: progress
            };
          }
          else{
            // jQuery continue hack
            return true;
          }
          m_.update_janky_builds(m_.janky_build_map[build]);
        }
      }); 
    }
  };

  m_.get_jenkins_feed = function(){
    jQuery.getFeed({
      url: '/rssAll',
      success: function(feed){
        m_.parse_jenkins_feed(feed.items);
      }
    });
  };

  m_.parse_jenkins_feed = function(feed){
    var build_title = '';
    var build_number = '';
    var build_state = '';
    var build_time = null;
    var time_diff = 0;
    var now = new Date();
    for (var i = 0; i < feed.length; i++){
      build_title = feed[i].title.split(' ')[0];
      if (typeof(m_.jenkins_data[build_title]) == 'undefined'){
        build_time = new Date(Date.parse(feed[i].updated));
        time_diff = now - build_time;
        time_diff /= 1000;
        build_time = secondsToHms(time_diff);
        build_number = feed[i].title.split(' ')[1];
        build_state = feed[i].title.split(' ')[2].replace('(', '').replace(')', '');
        m_.jenkins_data[build_title] = {
          title: build_title,
          job_title: build_title.trim().replace(' ', '-'),
          number: build_number,
          state: build_state,
          date: build_time
        };
      }
    }
    m_.render_janky_feed();
  };

  m_.render_janky_feed = function(){
    console.log('render feed called');
    var state = '';
    var red_cont = $('#janky_content #janky_reds');
    var pending_cont = $('#janky_content #janky_pending');
    var green_cont = $('#janky_content #janky_greens');
    var job_template = _.template($('#janky_templates div[data-template-name="job"]').html().replace(/&gt;/gi, '>').replace(/&lt;/gi, '<'));

    for (var key in m_.jenkins_data){
      state = m_.jenkins_data[key].state;
      console.log(m_.jenkins_data[key]);
      if (state == "stable"){
        green_cont.append(job_template(m_.jenkins_data[key]));
      }
      else if (state == "broken"){
        red_cont.append(job_template(m_.jenkins_data[key]));
      }
    }
  };

  m_.update_janky_sizes = function(){
    m_.window_width = $(window).width();
    m_.window_height = $(window).height();
    // m_.janky_drawer_offest = m_.janky_drawer_toggle.height() - 20;

    m_.janky_wrap.css({
      'height': m_.window_height
    });
  };

  m_.toggle_janky_drawer = function(){
    m_.update_janky_sizes();
    var toogle_offest = m_.janky_drawer_shown ? -(m_.window_height): -60;
    m_.janky_fixed.animate({
      bottom: toogle_offest
    }, 300);

    m_.janky_drawer_shown = !m_.janky_drawer_shown;
  };

  m_.init();
  return self;
}( ));