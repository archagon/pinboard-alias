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
	// TODO: update scroll position in layout

	$('.tag_group').each(function(i)
	{
		update_sticky_label($(this).attr('id'));
	});
});

$(document).click(function(event)
{ 
    // if($(event.target).parents().index($('#menucontainer')) == -1) {
    //     if($('#menucontainer').is(":visible")) {
    //         $('#menucontainer').hide()
    //     }
    // }
});

//////////////////////
// LAYOUT FUNCTIONS //
//////////////////////

// TODO: pass in objects instead of id strings

/**
 * Main layout method. Lays out the tags in two columns and sizes tag group div.
 */
function layout_tag_group(tag_group_id, animated)
{
	animated = typeof animated !== 'undefined' ? animated : false;

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

		var pos_css = 
		{
			top: padding_top + ((is_left ? total_height_left : total_height_right) + (j == 0 ? 0 : gap)),
			left: (is_left ? padding_left : 'auto'),
			right: (!is_left ? padding_right : 'auto')
		};
		animated ? jsPlumb.animate(this, pos_css) : $(this).css(pos_css);

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

	var height_css =
	{
		height:Math.max(total_height_left, total_height_right)
	};
	animated ? tag_group.animate(height_css) : tag_group.css(height_css);

	update_sticky_label(tag_group_id, animated);
}

function update_sticky_label(tag_group_id)
{
	animated = typeof animated !== 'undefined' ? animated : false;

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

		// ANIM
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

	// TODO: tag creation into separate function?

	// does the left tag already exist? if not, create one
	if (!$(tag_group_selector).children(".tag" + ".tag_group_left" + "#" + tag1_id).exists())
	{
		$(tag_group_selector).append("<div class='component window tag tag_group_left' id='" + tag1_id + "'>" + tag1 + "</div>");
	}

	// ditto right tag
	if (!$(tag_group_selector).children(".tag" + ".tag_group_right" + "#" + tag2_id).exists())
	{
		$(tag_group_selector).append("<div class='component window tag tag_group_right' id='" + tag2_id + "'>" + tag2 + "</div>");
		$("#" + tag2_id).click(function()
		{
			// set_delete_mode(tag2, connection_type, animated);
			delete_connection(tag1, tag2, connection_type, true);
		});
	}

	layout_tag_group(tag_group_id, animated);
	_connect_tags(tag1_id, tag2_id);
}

function set_delete_mode(tag, connection_type, animated)
{
	// TODO:
}

// the connection type isn't really necessary here, but I want my interface to be explicit
function delete_connection(tag1, tag2, connection_type, animated)
{
	console.log("deleting", tag1, tag2);

	var fade_time = 200;

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

	var remove_connection = function()
	{
		// TODO: use the actual connection object
		jsPlumb.detachAllConnections(tag2_id);
		$("#" + tag2_id).remove();

		if (num_connections == 1)
		{
			jsPlumb.detachAllConnections(tag1_id); // just in case
			$("#" + tag1_id).remove();
			// $("#" + tag_group_id).remove();
		}
		// else
		// {
		// 	layout_tag_group(tag_group_id, animated);
		// 	jsPlumb.repaint(tag1_id);
		// }
	};

	if (animated)
	{
		var connection = jsPlumb.getConnections(
		{
			source:tag1_id,
			target:tag2_id
		})[0];

		$(connection.connector.canvas).fadeOut(fade_time);
		$(connection.endpoints[0].canvas).fadeOut(fade_time);
		$(connection.endpoints[1].canvas).fadeOut(fade_time);
		$("#" + tag2_id).fadeOut(fade_time, function()
		{
			remove_connection();
		});

		$("#" + tag2_id).removeClass('tag');
		layout_tag_group(tag_group_id, true);
	}
	else
	{
		remove_connection();
		layout_tag_group(tag_group_id, animated);
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
        endpoint:"Blank",
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

	        create_sample_data();
		}
	};

    jsPlumb.ready(tagDemo.init);
});