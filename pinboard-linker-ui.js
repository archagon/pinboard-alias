// dependency: pinboard.js
// dependency: jquery.js
// dependency: pinboard-linker.js
// dependency: console.js
// jsplumb

// jsPlumb.Defaults.Container = $("body");

var starting_positions = {};

/**
 * Main layout method. Lays out the tags in two columns and sizes tag group div.
 */
function layout_tag_group(tag_group_id)
{
	var tag_group = $("#" + tag_group_id);
	var gap = 5;

	var num_left_children = tag_group.children('.tag_group_left').length;
	var num_right_children = tag_group.children('.tag_group_right').length;

	var total_height_left = 0;
	var total_height_right = 0;

	// even though padding has no effect on absolutely positioned elements,
	// we use it here anyway so that we can simply edit the CSS for a padding effect
	var padding_top = parseFloat(tag_group.css('padding-top'));
	var padding_left = parseFloat(tag_group.css('padding-left'));
	var padding_right = parseFloat(tag_group.css('padding-right'));

	tag_group.children('.tag').each(function(j)
	{
		var height = $(this).outerHeight(true);
		var is_left = $(this).hasClass('tag_group_left')

		$(this).css(
		{
			top: padding_top + ((is_left ? total_height_left : total_height_right) + (j == 0 ? 0 : gap)),
			left: (is_left ? padding_left : 'auto'),
			right: (!is_left ? padding_right : 'auto')
		});

		if (is_left)
		{
			total_height_left += ((j == 0 ? 0 : gap) + height);
		}
		else
		{
			total_height_right += ((j == 0 ? 0 : gap) + height);
		}
	});

	tag_group.height(Math.max(total_height_left, total_height_right));
}

$(window).resize(function()
{
	jsPlumb.repaintEverything();
});

// borrowed from http://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling b/c lazy
function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).outerHeight(false);

    return (((elemTop >= docViewTop) && (elemTop <= docViewBottom)) 		|| 	// top edge is visible
    		((elemBottom >= docViewTop) && (elemBottom <= docViewBottom)) 	|| 	// bottom edge is visible
    		((elemTop <= docViewTop) && (elemBottom >= docViewBottom)));		// object overlaps viewport
}

$(window).scroll(function()
{
	var scroll_offset = $(window).scrollTop();

	$('.tag_group').each(function(i)
	{
		// is the tag group currently visible? if not, reset the moving tags
		if (!isScrolledIntoView(this))
		{
			$(this).children('.tag_group_left').each(function(j)
			{
				$(this).css({ top: $(this).data('starting_position') + "px" });
			});

			return true;
		}

		$(this).children('.tag_group_left').each(function(j)
		{
			var tag_object = $(this);
			var tag_id = $(this).attr('id');
			var original_top = $(this).data('starting_position');

			var margin = parseFloat(original_top.substring(0, original_top.length - 2));
			var parent_position = tag_object.parent().offset().top;
			var parent_offset = parent_position - scroll_offset;

			if (parent_offset < 0)
			{
				var height = tag_object.outerHeight(true);
				var parent_height = parseFloat(tag_object.parent().css('height').substring(0, tag_object.parent().css('height').length - 2));

				var border = parent_height - margin - height;

				if (tag_object.position().top > border)
				{
					// border += 1;
					tag_object.css({ top: border + "px" });
					jsPlumb.repaint(tag_id);
				}
				else
				{
					var new_top = (Math.abs(parent_offset) + margin);
					tag_object.css({ top: new_top + "px" });
					jsPlumb.repaint(tag_id);
				}
			}
			else
			{
				tag_object.css({ top: margin + "px" });
				jsPlumb.repaint(tag_id);
			}
		});
	});
});

$(function()
{
	window.tagDemo =
	{
		init:function()
        {
			$('.tag_group').each(function(i)
	        {
	        	layout_tag_group($(this).attr('id'));

	        	$(this).children('.tag_group_left').each(function(j)
	        	{
	        		$(this).data('starting_position', $(this).css('top'));
				});
	        });

	        jsPlumb.importDefaults(
	        {
	            DragOptions : { cursor: "pointer", zIndex:2000 },
	            HoverClass:"connector-hover"
	        });

	        var connectorStrokeColor = "rgba(50, 50, 200, 1)",
	            connectorHighlightStrokeColor = "rgba(180, 180, 200, 1)",
	            hoverPaintStyle = { strokeStyle:"#7ec3d9" };

	        $('.tag_group').each(function(i)
	        {
	        	var left_tags = {};
	        	var right_tags = {};

	        	$(this).children('.tag_group_left').each(function(j)
	        	{
	        		left_tags[$(this).attr('id')] = true;
				});

				$(this).children('.tag_group_right').each(function(j)
	        	{
	    			right_tags[$(this).attr('id')] = true;
				});

				$.each(left_tags, function(lkey, lvalue)
				{
  					$.each(right_tags, function(rkey, rvalue)
  					{
				        var connection = jsPlumb.connect(
				        {
				            source:lkey, target:rkey,
				            paintStyle:
				            { 
				               lineWidth:10,
				               strokeStyle:connectorStrokeColor,
				               outlineColor:"#abc",
				               outlineWidth:1
				            },
				            hoverPaintStyle:hoverPaintStyle, 
				            anchor:"AutoDefault",
				            detachable:false,
				            endpointStyle:
				            { 
			                   radius:10
				            },                                                                
				       	});
  					});
				});
			});
		}
	};

    window.jsPlumbDemo =
    {        
        init:function()
        {    
            jsPlumb.importDefaults(
            {
                DragOptions : { cursor: "pointer", zIndex:2000 },
                HoverClass:"connector-hover"
            });
    
            // hover paint style is merged on normal style, so you
            // don't necessarily need to specify a lineWidth
            var connectorStrokeColor = "rgba(50, 50, 200, 1)",
                connectorHighlightStrokeColor = "rgba(180, 180, 200, 1)",
                hoverPaintStyle = { strokeStyle:"#7ec3d9" };

            // connect window1 to window2 with a 13 px wide olive colored Bezier, from the BottomCenter of 
            // window1 to 3/4 of the way along the top edge of window2.  give the connection a 1px black outline,
            // and allow the endpoint styles to derive their color and outline from the connection.
            // label it "Connection One" with a label at 0.7 of the length of the connection, and put an arrow that has a 50px
            // wide tail at a point 0.2 of the length of the connection.  we use 'cssClass' and 'endpointClass' to assign
            // our own css classes, and the Label overlay has three css classes specified for it too.  we also give this
            // connection a 'hoverPaintStyle', which defines the appearance when the mouse is hovering over it. 
            var connection1 = jsPlumb.connect(
            {
                source:"window1", 
                   target:"window2",                    
                connector:["Bezier", { curviness:70 }],
                   cssClass:"c1",
                   endpoint:"Blank",
                   endpointClass:"c1Endpoint",                                                       
                   anchors:["BottomCenter", [ 0.75, 0, 0, -1 ]], 
                   paintStyle:{ 
                    lineWidth:6,
                    strokeStyle:"#a7b04b",
                    outlineWidth:1,
                    outlineColor:"#666"
                },
                endpointStyle:{ fillStyle:"#a7b04b" },
                   hoverPaintStyle:hoverPaintStyle,               
                   overlays : [
                    ["Label", {                                                                           
                        cssClass:"l1 component label",
                        label : "Connection One", 
                        location:0.7,
                        id:"label",
                        events:{
                            "click":function(label, evt) {
                                alert("clicked on label for connection " + label.component.id);
                            }
                        }
                    }],
                    ["Arrow", {
                        cssClass:"l1arrow",
                        location:0.5, width:20,length:20,
                        events:{
                            "click":function(arrow, evt) {
                                alert("clicked on arrow for connection " + arrow.component.id);
                            }
                        }
                    }]
                ]
            });            
                
                    
            var w23Stroke = "rgb(189,11,11)"; 
            var connection3 = jsPlumb.connect(
            {
                source:"window2", 
                target:"window3", 
                paintStyle:{ 
                    lineWidth:8,
                    strokeStyle:w23Stroke,
                    outlineColor:"#666",
                    outlineWidth:1 
                },
                detachable:false,
                hoverPaintStyle:hoverPaintStyle, 
                anchors:[ [ 0.3 , 1, 0, 1 ], "TopCenter" ], 
                endpoint:"Rectangle", 
                endpointStyles:[
                    { gradient : { stops:[[0, w23Stroke], [1, "#558822"]] }},
                    { gradient : {stops:[[0, w23Stroke], [1, "#882255"]] }}
                ]    
            });                    
                
            var connection2 = jsPlumb.connect(
            {
                source:'window3', target:'window4', 
                paintStyle:{ 
                   lineWidth:10,
                   strokeStyle:connectorStrokeColor,
                   outlineColor:"#666",
                   outlineWidth:1
                },
                hoverPaintStyle:hoverPaintStyle, 
                anchor:"AutoDefault",
                detachable:false,
                endpointStyle:{ 
                       gradient : { 
                           stops:[[0, connectorStrokeColor], [1, connectorHighlightStrokeColor]],
                           offset:17.5, 
                           innerRadius:15 
                       }, 
                       radius:35
                },                                                                
                label : function(connection) { 
                    var d = new Date();
                    var fmt = function(n, m) { m = m || 10;  return (n < m ? new Array(("" + m).length - (""+n).length + 1).join("0") : "") + n; }; 
                    return (fmt(d.getHours()) + ":" + fmt(d.getMinutes()) + ":" + fmt(d.getSeconds())+ "." + fmt(d.getMilliseconds(), 100)); 
                },
                labelStyle:{
                    cssClass:"component label"
                }
           	});

            // var conn4Color = "rgba(46,164,26,0.8)";
            // var connection4 = jsPlumb.connect(
            // {  
            //     source:'window5', 
            //     target:'window6', 
            //     connector:[ "Flowchart", { cornerRadius:10 } ],
            //     anchors:["Center", "Center"],  
            //     paintStyle:{ 
            //         lineWidth:9, 
            //         strokeStyle:conn4Color, 
            //         outlineColor:"#666",
            //         outlineWidth:2,
            //         joinstyle:"round"
            //     },
            //     hoverPaintStyle:hoverPaintStyle,
            //     detachable:false,
            //     endpointsOnTop:false, 
            //     endpointStyle:{ radius:65, fillStyle:conn4Color },
            //     labelStyle : { cssClass:"component label" },
            //     label : "big\nendpoints"
            // });

            // double click on any connection 
            jsPlumb.bind("dblclick", function(connection, originalEvent)
            	{
            		alert("double click on connection from " + connection.sourceId + " to " + connection.targetId);
            	});

            // single click on any endpoint
            jsPlumb.bind("endpointClick", function(endpoint, originalEvent)
            	{
            		alert("click on endpoint on element " + endpoint.elementId);
            	});

            // context menu (right click) on any component.
            jsPlumb.bind("contextmenu", function(component, originalEvent)
				{
                	alert("context menu on component " + component.id);
                	originalEvent.preventDefault();
                	return false;
            	});
        }
    };

    // jsPlumb.ready(jsPlumbDemo.init);
    jsPlumb.ready(tagDemo.init);
});

function ui_error(str)
{
    err(str);
}

function enable_div(div_id, enable)
{
    $("#" + div_id + " :input").attr("disabled", !enable);
}

function hide_div(div_id, hide)
{
    if (hide)
    {
        $("#" + div_id).hide();
    }
    else
    {
        $("#" + div_id).show();    
    }
}

function submit_login(div_id, api_token, proxy)
{
    dbg("UI: submitting login with " + api_token + ", " + proxy);
    
    enable_div(div_id, false);

    token_match = api_token.match(token_regex());

    // is token in the correct format?
    if (!token_match)
    {
        ui_error("Invalid token format! Token should be in the form [username]:[token].")
        enable_div(div_id, true);
        return;
    }

    // is the proxy URL reachable?
    if (proxy == "")
    {
        dbg("UI: successfully submitted login without proxy");
        test_login(token_match[1], token_match[2], proxy);
        hide_div(div_id, true);
        return;
    }
    else
    {
        // TODO: abstract out proxy bullshit into separate class
        url = "https://feeds.pinboard.in/json/t:dopefish";
        $.ajax({
              url: proxy + encodeURIComponent(url),
              timeout: 10000
          })
          .done(function(data)
          {
            dbg("UI: successfully submitted login after proxy check");
            test_login(token_match[1], token_match[2], proxy);
            hide_div(div_id, true);
            return;
        })
        .fail(function(jqXHR, textStatus, errorThrown, textStatus)
        {
             ui_error("Proxy domain can't be reached! Are you sure the proxy supports JSONP?")
             enable_div(div_id, true);
             return;
        });
    }
}

function test_login(username, token, proxy)
{
    hide_div("ui_tag_view", false);

    dbg("UI: testing login")
    pinboard = new Pinboard(username, token, proxy, true);
    pinboard.list_posts(function(data){}, [{ "name":"tag", "value":"programming" }]);
    pinboard.add("file://test", "test", function(data){});
}

$(function()
{
    // TODO: make form visible
});