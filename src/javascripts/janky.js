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
  m_.jenkins_data = { };

  m_.init = function(){
    m_.janky_fixed = $('#janky_fixed');
    m_.janky_wrap = $('#janky_wrap');
    m_.janky_content = $('#janky_content');
    m_.janky_drawer_toggle = $('#janky_fixed #janky_drawer_toggle');

    m_.update_janky_sizes();

    m_.janky_fixed.css({
      'bottom': -(m_.window_height)
    });

    // Attach drawer toggle
    m_.janky_drawer_toggle.bind('click', m_.toggle_janky_drawer);

    // $(window).bind('resize', m_.update_janky_sizes);

    m_.get_jenkins_feed();
    m_.janky_fixed.show();
    m_.render_janky_feed();
  };

  // Public Methods
  self.update_janky_feed = function(){
    m_.jenkins_data = { };
    m_.get_jenkins_feed();
  };

  // Private Methods

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
    for (var i = 0; i < feed.length; i++){
      build_title = feed[i].title.split(' ')[0];
      if (typeof(m_.jenkins_data[build_title]) == 'undefined'){
        build_time = feed[i].updated;
        build_number = feed[i].title.split(' ')[1];
        build_state = feed[i].title.split(' ')[2].replace('(', '').replace(')', '');
        m_.jenkins_data[build_title] = {
          'title': build_title,
          'number': build_number,
          'state': build_state,
          'date': build_time
        };
      }
    }
    m_.render_janky_feed();
  };

  m_.render_janky_feed = function(){
    console.log('render feed called');
    var job_template = $('#janky_templates div[data-template-name="job"]').html();
    console.log(job_template);

    for (var key in m_.jenkins_data){
      m_.janky_content.append(job_template);
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