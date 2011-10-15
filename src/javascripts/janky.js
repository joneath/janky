(function(){
  var self = { };
  
  // Private Attributes
  var window_height = 0;
  var window_width = 0;
  var janky_drawer_offest = 0;
  var janky_wrap = null;
  var janky_drawer_toggle = null;
  var janky_drawer_shown = false;

  var init = function(){
    janky_wrap = $('#janky_wrap');
    janky_drawer_toggle = $('#janky_wrap #janky_drawer_toggle');
    window_height = $(window).height();
    window_width = $(window).width();

    init_janky_wrap();
  };

  // Private Methods
  function init_janky_wrap(){
    update_janky_sizes();
    janky_wrap.css({
      'bottom':janky_drawer_offest
    });

    // Attach drawer toggle
    janky_drawer_toggle.bind('click', toggle_janky_drawer);

    // Attach window size change
    // $(window).bind('resize', update_janky_position);

    janky_wrap.show();
  }

  function update_janky_sizes(){
    janky_drawer_offest = janky_drawer_toggle.height();
  }

  function update_janky_position(e){
    if (janky_drawer_shown){ return true; }
    update_janky_sizes();

    console.log(e);
  }

  function toggle_janky_drawer(){
    update_janky_sizes();
    var toogle_offest = janky_drawer_shown ? 0: janky_drawer_offest;
    janky_wrap.animate({
      bottom: toogle_offest
    }, 300);
    janky_drawer_shown = !janky_drawer_shown;
  }

  init();
  return self;
}( ));