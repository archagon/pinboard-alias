// jquery
// jsplumb
// jsPlumb.Defaults.Container = $("body");

// TODO: public/private methods

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

jQuery.fn.exists = function()
{
	return this.length > 0;
}

// adapted from http://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling b/c lazy
jQuery.fn.isOnScreen = function()
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(this).offset().top;
    var elemBottom = elemTop + $(this).outerHeight(false);

    return (((elemTop >= docViewTop) && (elemTop <= docViewBottom)) 		|| 	// top edge is visible
    		((elemBottom >= docViewTop) && (elemBottom <= docViewBottom)) 	|| 	// bottom edge is visible
    		((elemTop <= docViewTop) && (elemBottom >= docViewBottom)));		// object overlaps viewport	
}

///////////////////
// WINDOW EVENTS //
///////////////////

$(window).resize(function()
{
	jsPlumb.repaintEverything();
});

$(window).scroll(function()
{
	// TODO: make sure layout is done first

	$('.tag_group').each(function(i)
	{
		update_sticky_label($(this).attr('id'));
	});
});

//////////////////////
// LAYOUT FUNCTIONS //
//////////////////////

// TODO: pass in objects instead of id strings

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

		// can't use conditional as lvalue... lame!
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

function update_sticky_label(tag_group_id)
{
	var tag_group_object = $("#" + tag_group_id);
	var scroll_offset = $(window).scrollTop();
	
	// is the tag group currently visible? if not, reset the left tag, just in case
	if (!tag_group_object.isOnScreen())
	{
		$(tag_group_object).children('.tag_group_left').each(function(j)
		{
			// TODO: no longer relevant
			$(tag_group_object).css({ top: $(tag_group_object).data('starting_position') + "px" });
		});

		return true;
	}

	// otherwise, if we're in a browser that supports it, move the left tag while scrolling
	$(tag_group_object).children('.tag_group_left').each(function(j)
	{
		var tag_object = $(this);
		var tag_id = $(this).attr('id');

		var padding_top = parseFloat(tag_object.parent().css('padding-top'));
		var padding_left = parseFloat(tag_object.parent().css('padding-left'));
		var padding_right = parseFloat(tag_object.parent().css('padding-right'));

		var starting_position = parseFloat($(this).data('starting_position'));
		var height = tag_object.outerHeight(true);
		var parent_position = tag_object.parent().offset().top;
		var parent_padded_position = parent_position + padding_top;
		var parent_offset = scroll_offset - parent_position;
		var parent_padded_offset = scroll_offset - parent_padded_position;
		var parent_height = parseFloat(tag_object.parent().css('height').substring(0, tag_object.parent().css('height').length - 2));

		// console.log(parent_position, parent_padded_position);
		var old_position = tag_object.position().top;
		var new_position = padding_top + Math.min(parent_height - height, Math.max(parent_offset, 0));
		tag_object.css({ top: new_position + "px" });

		if (old_position != new_position)
		{
			jsPlumb.repaint(tag_id);
		}
	});
}

//////////////////////////
// ADD/DELETE FUNCTIONS //
//////////////////////////

// 	<div class="demo" id="tagtest">
// 		<div class="tag_group" id="programming_to">
// 			<div class="component window tag tag_group_left" id="tag_programming1">Programming</div>

// TODO: multiple overlapping deletes

function add_connection(tag1, tag2, connection_type, animated)
{
	// TODO: classes and formats as global vars
	// TODO: sanitize tag names
	// TODO: to/from classes in tags and groups

	var tag_group_id = _tag_group_id(tag1, connection_type);
	var tag1_id = _tag_id(tag1, connection_type);
	var tag2_id = _tag_id(tag2, connection_type);

	var tag_group_selector = ".tag_group" + "#" + tag_group_id;

	console.log(tag_group_id, tag_group_selector, "exists?", $(tag_group_selector).exists());

	// does the appropriate tag group exist? if not, create one
	if (!$(tag_group_selector).exists())
	{
		// TODO: access tagtest thru function?
		$("#tagtest").append("<div class='tag_group' id='" + tag_group_id + "'></div>");
	}

	// does the tag connection already exist? if so, return
	if ($(tag_group_selector).children("#" + tag1_id).exists() && $(tag_group_selector).children("#" + tag2_id).exists())
	{
		// TODO: verify
		return;
	}

	// does the left tag already exist? if not, create one
	if (!$(tag_group_selector).children(".tag" + ".tag_group_left" + "#" + tag1_id).exists())
	{
		$(tag_group_selector).append("<div class='component window tag tag_group_left' id='" + tag1_id + "'>" + tag1 + "</div>");
	}

	// ditto right tag
	if (!$(tag_group_selector).children(".tag" + ".tag_group_right" + "#" + tag2_id).exists())
	{
		$(tag_group_selector).append("<div class='component window tag tag_group_right' id='" + tag2_id + "'>" + tag2 + "</div>");
	}

	layout_tag_group(tag_group_id);
	_connect_tags(tag1_id, tag2_id);
}

// the connection type isn't really necessary here, but I want my interface to be explicit
function delete_connection(tag1, tag2, connection_type, animated)
{
	console.log("deleting", tag1, tag2);

	var tag_group_id = _tag_group_id(tag1, connection_type);
	var tag1_id = _tag_id(tag1, connection_type);
	var tag2_id = _tag_id(tag2, connection_type);

	var tag_group_selector = ".tag_group" + "#" + tag_group_id;
	console.log(tag_group_selector);

	// does the appropriate tag group exist? if not, return
	if (!$(tag_group_selector).exists())
	{
		console.log("tag group does not exist");
		return;
	}

	// do the tags exist? if not, return
	if (!$(tag_group_selector).children("#" + tag1_id).exists() || !$(tag_group_selector).children("#" + tag2_id).exists())
	{
		console.log("tag does not exist");
		return;
	}

	var num_connections = _connections_for_tag(tag1_id).length;

	// TODO: use the actual connection object
	jsPlumb.detachAllConnections(tag2_id);
	$("#" + tag2_id).remove();

	if (num_connections == 1)
	{
		jsPlumb.detachAllConnections(tag1_id); // just in case
		$("#" + tag1_id).remove();
		$("#" + tag_group_id).remove();
	}
	else
	{
		layout_tag_group(tag_group_id);
		jsPlumb.repaint(tag1_id);
	}
}

function _connections_for_tag(tag_id)
{
	// TODO: this needs to go away
	var id_elements = tag_id.split('_');
	var connection_type = id_elements[id_elements.length - 1];

	var is_left;

	if ($("#" + tag_id).hasClass("tag_group_left"))
	{
		is_left = true;
	}
	else
	{
		is_left = false;
	}
	// TODO: assert on no class

	return_array = [];

	var siblings = $("#" + tag_id).siblings((is_left ? ".tag_group_right" : ".tag_group_left"));
	siblings.each(function(i)
	{
		return_array.push($(this).attr('id'));
	});

	return return_array;
}

function _connect_tags(tag1_id, tag2_id)
{
	// TODO: is static possible?
	var connectorStrokeColor = "rgba(50, 50, 200, 1)",
        connectorHighlightStrokeColor = "rgba(180, 180, 200, 1)",
        hoverPaintStyle = { strokeStyle:"#7ec3d9" };

    var connection = jsPlumb.connect(
    {
        source:tag1_id, target:tag2_id,
        connector:["Bezier", { curviness:70 }],
        paintStyle:
        { 
           lineWidth:5,
           strokeStyle:connectorStrokeColor,
           outlineColor:"#abc",
           outlineWidth:1
        },
        anchors:[[ "Right" ], [ "Left" ]],
        detachable:false,
        // endpoint:"Rectangle",
        endpointStyle:
        { 
           radius:10,
           // cssClass:"l1arrow",
        },                    
   	});

   	return connection;
}

function _tag_group_id(tag, connection_type)
{
	return tag + "_" + connection_type;
}

function _tag_id(tag, connection_type)
{
	return "tag_" + tag + "_" + connection_type;
}

///////////
// OTHER //
///////////

function create_sample_data()
{
	add_connection("programming", "networking", "to");
	add_connection("programming", "physics", "to");
	add_connection("programming", "game-programming", "to");
	add_connection("programming", "c", "to");
	add_connection("programming", "python", "to");
	add_connection("programming", "coding", "tofrom");
}

$(function()
{
	window.tagDemo =
	{
		init:function()
        {
	        jsPlumb.importDefaults(
	        {
	            DragOptions : { cursor: "pointer", zIndex:2000 },
	            HoverClass:"connector-hover"
	        });

	        jsPlumb.bind("endpointClick", function(endpoint, originalEvent)
        	{
        		var tag1 = $("#" + endpoint.elementId).text();
        		var is_right = $("#" + endpoint.elementId).hasClass('tag_group_right');
				var connections = _connections_for_tag(endpoint.elementId);

        		for (i in connections)
        		{
        			var tag2_id = connections[i];
        			var tag2 = $("#" + tag2_id).text();
        			delete_connection((is_right ? tag2 : tag1), (is_right ? tag1 : tag2), "to");
        		}
        	});

	        create_sample_data();
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