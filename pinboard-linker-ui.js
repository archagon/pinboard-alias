// dependency: pinboard.js
// dependency: jquery.js
// dependency: pinboard-linker.js
// dependency: console.js

function ui_error(str)
{
	err(str);
}

function enable_div(div_id, enable)
{
	$("#" + div_id + " :input").attr("disabled", !enable);
}

function submit_login(div_id, api_token, jsonp_proxy)
{
	dbg("UI: submitting login with " + api_token + ", " + jsonp_proxy);
	
	enable_div(div_id, false);

	// is token empty?
	if (api_token == "")
	{
		ui_error("Invalid API token!");
		enable_div(div_id, true);
		return;
	}

	// is token in the correct format?
	if (false)
	{
		ui_error("Invalid token format! Token should be in the form [username]:[token].")
		enable_div(div_id, true);
		return;
	}

	// is the proxy URL reachable?
	if (jsonp_proxy == "")
	{
		dbg("UI: successfully submitted login without proxy");
		startup("asdf", api_token, jsonp_proxy);
		return;
	}
	else
	{
		$.ajax(
		{
			type: "GET",
			url: jsonp_proxy + encodeURIComponent('http://www.example.com') + '&callback=?',
			dataType: 'json',
			timeout:3000
		})
		.done(function(data)
		{
			dbg("UI: successfully submitted login after proxy check");
		})
    	.fail(function(jqXHR, textStatus, errorThrown, textStatus)
		{
			err("Proxy domain can't be reached! Are you sure the proxy supports JSONP?")
			enable_div(div_id, true);
			return;
		});
	}
}

$(function()
{
	// TODO: make form visible
});