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