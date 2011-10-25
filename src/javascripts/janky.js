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

var date_sort_desc = function (obj1, obj2) {
  // This is a comparison function that will result in dates being sorted in
  // DESCENDING order.

  var date1 = new Date(Date.parse(obj1.last_success));
  var date2 = new Date(Date.parse(obj2.last_success));

  if (date1 > date2) return -1;
  if (date1 < date2) return 1;
  return 0;
};

var date_sort_asc = function (obj1, obj2) {
  // This is a comparison function that will result in dates being sorted in
  // ASCENDING order. As you can see, JavaScript's native comparison operators
  // can be used to compare dates. This was news to me.
  var date1 = new Date(Date.parse(obj1.last_success));
  var date2 = new Date(Date.parse(obj2.last_success));

  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

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
  m_.janky_settings_toggle = false;
  m_.janky_settings_toggle_el = null;
  m_.janky_settings_cont = null;
  m_.janky_settings_data = { };
  m_.jenkins_builds_cont = null;
  m_.update_interval = null;
  m_.janky_build_map = { };
  m_.jenkins_data = { };

  m_.janky_default_settings = {
    startup_shown: false,
    update_delay: 30
  };

  m_.jenkins_state_map = {
    '0': 'broken',
    '1': 'In progress',
    '4': 'stable',
    '5': 'In progress',
    '8': 'disabled',
    '11': 'In progress'
  };

  m_.init = function(){
    m_.janky_fixed = $('#janky_fixed');
    m_.janky_wrap = $('#janky_wrap');
    m_.janky_content = $('#janky_content');
    m_.janky_drawer_toggle = $('#janky_fixed #janky_drawer_toggle');
    m_.jenkins_builds_cont = $('#executors');
    m_.janky_settings_cont = $('#janky_settings');
    m_.janky_settings_toggle = $('#janky_settings_toggle');
    m_.root = $('body');

    m_.update_janky_sizes();

    m_.janky_fixed.css({
      'bottom': -(m_.window_height)
    });

    m_.load_settings();

    // Attach drawer toggle
    m_.janky_drawer_toggle.bind('click', m_.toggle_janky_drawer);

    $(window).bind('resize', m_.window_resize);

    m_.janky_settings_toggle.bind('click', self.toggle_settings);

    $('div.switch').bind('click', m_.setting_changed);

    $('#janky_refresh_slider').bind('change', m_.slider_update);

    m_.get_jenkins_feed();
    m_.janky_fixed.show();

    // Ghetto timeout for async template load
    setTimeout(m_.render_janky_feed, 100);
    setTimeout(m_.build_change, 100);

    m_.janky_pulsate_broken();
  };

  // Public Methods

  self.toggle_settings = function(){
    if (janky_settings_toggle){
      m_.janky_settings_cont.fadeIn();
    }
    else{
      m_.janky_settings_cont.fadeOut();
    }
    janky_settings_toggle = !janky_settings_toggle;
  };

  self.update_janky_feed = function(){
    // m_.jenkins_data = { };

    $.get(window.location.href, function(data){
      m_.root = $(data);
      m_.get_jenkins_feed();

      $('div#janky_content div.janky_job').remove();
      // Ghetto timeout for async template load
      setTimeout(m_.render_janky_feed, 100);
      setTimeout(m_.build_change, 100);
    });
  };

  // Private Methods

  m_.slider_update = function(e){
    var value = $(this).val();
    $('#janky_refresh_slider_range').text(value + 's');
    if (parseInt(value) > 0){
      m_.update_frequency(value);
    }
    else{
      clearInterval(m_.update_interval);
    }
    m_.janky_settings_data["update_delay"] = value;
    m_.save_settings();
  };

  m_.update_frequency = function(delay){
    delay = parseInt(delay) * 1000;
    clearInterval(m_.update_interval);
    m_.update_interval = setInterval(self.update_janky_feed, delay);
  };

  m_.setting_changed = function(){
    var key = $(this).attr('id');
    var value = false;
    if ($(this).hasClass('switch_on')){
      $(this).removeClass('switch_on').addClass('switch_off');
    }
    else{
      $(this).removeClass('switch_off').addClass('switch_on');
      value = true;
    }

    m_.janky_settings_data[key] = value;
    m_.save_settings();
  };

  m_.load_settings = function(){
    m_.janky_settings_data = localStorage.getItem('janky_settings');
    if (m_.janky_settings_data){
      m_.janky_settings_data = JSON.parse(m_.janky_settings_data);
      $.extend(m_.janky_default_settings, m_.janky_settings_data);
    }
    else{
      m_.janky_settings_data = m_.janky_default_settings;
    }

    var attr = false;
    for (var key in m_.janky_settings_data){
      attr = m_.janky_settings_data[key];
      if (key == "update_delay"){
        $('#janky_refresh_slider').attr('value', attr);
        $('#janky_refresh_slider_range').text(attr + 's');
        if (parseInt(attr) > 0){
          m_.update_frequency(attr);
        }
        else{
          clearInterval(m_.update_interval);
        }
      }
      else{
        if (attr){
          $('#janky_settings #' + key).addClass('switch_on');
        }
        else{
          $('#janky_settings #' + key).addClass('switch_off');
        } 
      }
    }

    if (m_.janky_settings_data.startup_shown){
      m_.janky_drawer_shown = false;
      m_.toggle_janky_drawer(false, false);
    }
  };

  m_.save_settings = function(){
    var json = JSON.stringify(m_.janky_settings_data);
    localStorage.setItem('janky_settings', json);
  };

  m_.janky_pulsate_broken = function(){
    var toggle = false;
    var color_class = "on";
    setInterval(function(){
      $('div.janky_job, #janky_reds > h1').removeClass(color_class);
      color_class = toggle ? "on": "off";
      $('div.janky_job, #janky_reds > h1').addClass(color_class);
      toggle = !toggle;
    }, 2000);
  };

  m_.update_janky_builds = function(build){
    var janky_job = $('div.janky_job[data-job-title="' + build.title.replace(/ /g, '_').replace(/-/g, '_') + '"]');
    janky_job.append('<meter value="' + build.progress + '" max="100"></meter>');
  };

  m_.build_change = function(e){
    if ($(m_.root).find('#executors table.progress-bar')){
      var rows = $(m_.root).find('#executors > tbody:last > tr');
      var build = '';
      var progress = 0;
      var progress_cont = null;
      var running_time = 0;

      rows.each(function(i){
        if ($(this).find('table.progress-bar').length > 0){
          build = $(this).find('a:first').text();
          progress = $(this).find('td.progress-bar-done').css('width').replace('px', '');
          running_time = $(this).find('table.progress-bar').attr('title');

          m_.janky_build_map[build] = {
            title: build,
            progress: progress,
            running_time: running_time
          };
          m_.update_janky_builds(m_.janky_build_map[build]);
        }
      }); 
    }
  };

  m_.get_jenkins_feed = function(){
    // jQuery.getFeed({
    //   url: '/rssAll',
    //   success: function(feed){
    //     m_.parse_jenkins_feed(feed.items);
    //   }
    // });
    var feed = null;
    var fail_feed = [ ];
    var success_feed = [ ];
    var misc_feed = [ ];
    var job = { };
    var that = null;
    var hash_index = 0;
    $(m_.root).find('#projectstatus > tbody:first > tr:gt(0)').each(function(){
      that = this;
      job = { };

      job.status = $('td:eq(0)', that).attr('data');
      job.title = $('a', that).text();
      
      hash_index = job.title.indexOf('#');
      job.title = job.title.substring(0, hash_index != -1 ? hash_index : job.title.length);

      job.last_success = $('td:eq(6)', that).attr('data');
      job.last_failure = $('td:eq(7)', that).attr('data');
      job.last_duration = $('td:eq(8)', that).attr('data');

      if (job.status == '4'){
        success_feed.push(job);
      }
      else if (job.status == '0'){
        fail_feed.push(job);
      }
      else{
        misc_feed.push(job);
      }
    });

    success_feed.sort(date_sort_asc);
    fail_feed.sort(date_sort_asc);

    feed = success_feed.concat(fail_feed);
    feed = feed.concat(misc_feed);

    m_.parse_jenkins_feed(feed);
  };

  m_.parse_jenkins_feed = function(feed){
    var title = '';
    var status = '';
    var last_success = null;
    var last_failure = null;
    var last_duration = null;
    var last_build = null;
    var build_time = "";
    var time_diff = 0;
    var now = new Date();
    for (var i = 0; i < feed.length; i++){
      build_time = "";
      title = feed[i].title;
      last_success = new Date(Date.parse(feed[i].last_success));
      last_failure = new Date(Date.parse(feed[i].last_failure));
      last_build = last_failure < last_success ? last_failure : last_success;
      if (last_build){
        time_diff = now - build_time;
        time_diff /= 1000;
        build_time = secondsToHms(time_diff);
      }
      time_diff = now - last_success;
      time_diff /= 1000;
      last_success = secondsToHms(time_diff);

      time_diff = now - last_failure;
      time_diff /= 1000;
      last_failure = secondsToHms(time_diff);

      status = m_.jenkins_state_map[feed[i].status];
      m_.jenkins_data[title] = {
        title: title,
        job_title: title.replace(/ /g, '_').replace(/-/g, '_'),
        state: status,
        build_time: build_time,
        last_failure: last_failure,
        last_success: last_success
      };
    }
  };

  m_.render_janky_feed = function(){
    var state = '';
    var red_cont = $('#janky_content #janky_reds');
    var pending_cont = $('#janky_content #janky_pending');
    var green_cont = $('#janky_content #janky_greens');
    var job_template = _.template($('#janky_templates div[data-template-name="job"]').html().replace(/&gt;/gi, '>').replace(/&lt;/gi, '<'));
    for (var key in m_.jenkins_data){
      state = m_.jenkins_data[key].state;
      if (state == "stable"){
        delete m_.jenkins_data[key].last_success;
        green_cont.append(job_template(m_.jenkins_data[key]));
      }
      else if (state == "broken"){
        red_cont.append(job_template(m_.jenkins_data[key]));
      }
      else if (state == "In progress"){
        pending_cont.append(job_template(m_.jenkins_data[key]));
        pending_cont.find('h3').text('');
        pending_cont.show();
      }
    }
  };

  m_.window_resize = function(){
    m_.update_janky_sizes();
    var toogle_offest = m_.janky_drawer_shown ? -60: -(m_.window_height);
    m_.janky_fixed.css({
      bottom: toogle_offest
    });
  };

  m_.update_janky_sizes = function(){
    m_.window_width = $(window).width();
    m_.window_height = $(window).height();
    // m_.janky_drawer_offest = m_.janky_drawer_toggle.height() - 20;

    m_.janky_wrap.css({
      'height': m_.window_height
    });
  };

  m_.toggle_janky_drawer = function(e, animated){
    m_.update_janky_sizes();
    var toogle_offest = m_.janky_drawer_shown ? -(m_.window_height): -60;

    if (m_.janky_drawer_shown){
      $('#janky_drawer_toggle').text('Show');
    }
    else{
      $('#janky_drawer_toggle').text('Hide');
    }

    if (typeof(animated) != 'undefined' && animated === false){
      m_.janky_fixed.css({
        bottom: toogle_offest
      });
    }
    else{
      m_.janky_fixed.animate({
        bottom: toogle_offest
      }, 300);
    }

    m_.janky_drawer_shown = !m_.janky_drawer_shown;
  };

  m_.init();
  return self;
}( ));