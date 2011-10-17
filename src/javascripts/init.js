var JANKY_INCLUDES = {
  css: [
    chrome.extension.getURL("css/janky.css")
  ],
  javascript: [
    chrome.extension.getURL("javascripts/jquery-1.6.4.min.js"),
    chrome.extension.getURL("javascripts/jquery.jfeed.pack.js"),
    chrome.extension.getURL("javascripts/underscore-min.js"),
    chrome.extension.getURL("javascripts/iso8601.min.js"),
    chrome.extension.getURL("javascripts/janky.js")
  ],
  templates: [
    {
      url: chrome.extension.getURL("views/job.template.html"),
      title: 'job'
    }
  ]
};

var JANKY_INDEX = chrome.extension.getURL("views/index.html");

$(document).ready(function(){
  (function(){
    var self = { };

    var jenkins = false;

    var init = function(){
      // Ghetto check for if on jenkins page...Should refactor
      if ($('#footer > a').attr('href') != "http://jenkins-ci.org/"){ return; }
      jenkins = true;

      run_includes();
      inject_index();
    };

    var run_includes = function(){
      var i = 0;
      var head = $('head');
      for (i = 0; i < JANKY_INCLUDES.css.length; i++){
        head.append('<link href="' + JANKY_INCLUDES.css[i] + '" media="screen" rel="stylesheet" type="text/css">');
      }

      for (i = 0; i < JANKY_INCLUDES.javascript.length; i++){
        head.append('<script type="text/javascript" src="' + JANKY_INCLUDES.javascript[i] + '">');
      }
    };

    var inject_index = function(){
      $('body').append('<div id="janky_fixed"></div>');
      $('#janky_fixed').load(JANKY_INDEX, function(body){
        inject_templates();
      });
    };

    var inject_templates = function(){
      $('#janky_fixed').append('<div id="janky_templates" style="display:none;"></div>');
      for (var i = 0; i < JANKY_INCLUDES.templates.length; i++){
        $('#janky_templates').append('<div data-template-name="' + JANKY_INCLUDES.templates[i].title + '"></div>');
        $('#janky_templates > div:last').load(JANKY_INCLUDES.templates[i].url);
      }
    };

    var is_jenkins = function(){
      return jenkins;
    };

    init();
    return self;
  })( );
});