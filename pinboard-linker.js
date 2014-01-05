/*
Welcome to the Pinboard Linker! Using this script, you can set up tag synonyms.
A tag synonym is unidirectional (tag1 > tag2) if every item tagged with tag2
also has to be tagged with tag1. A tag synonym is bidirectional (tag2 <> tag1)
if both tag1 and tag2 have to be tagged with tag2 and tag1. (Equivalent to
tag1 > tag2 and tag2 > tag1.) These rules are applied as a batch operation
over your tags.

Why do this? Well, I've been frequently running into issues where I tag items with
similar tags, but then forget to apply them consistently. (For example, 'apps' and
'applications'.) Also, on occasion, it really helps to have a super-tag that applies
to every tag in a category. ('monet' should always have the 'artists' tag, but it's
annoying to have to remember both tags every time.) You can also use this technique
to create shortcuts for your tags. (Want to tag 'documents' as 'docs'? Simply create
a bidirectional alias!) In short, it's something that will substantially increase
the organizational power of your Pinboard without the downsides of messy special cases
like tag folders.

This script relies on the python-pinboard project, which you can find here:
https://github.com/mgan59/python-pinboard

We store the settings for the Linker in the extended description for a special tag.
I haven't tested exactly how long an extended description can be, but it's pretty big.
Since pinboard tags can't contain whitespace or commas, the settings format relies on
them to split up lines and tokens.

Potential future features:
	* destructive aliases: docs ~> documentation, which replaces all
	  'docs' with 'documentation' (you can do this manually through the web interface
	  in the interim)
*/

// TODO: GUI
// TODO: token
// TODO: add "dirty" flag to sync

/////////////////////////////
// CONFIGURABLE PARAMETERS //
/////////////////////////////

var settings_tag_name = "pinboard-linker-settings";

/////////////////////////////////
// NON-CONFIGURABLE PARAMETERS //
/////////////////////////////////

var version = "0.1";

////////////////////
// GLOBAL OBJECTS //
////////////////////

var pinboard_object = null;
var synonym_map = {};
var dirty = false;

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function token_regex()
{
	return /^([^:]+):([^:]+)$/;
}

////////////////////
// MAIN FUNCTIONS //
////////////////////

function startup(username, token, proxy)
{
	msg("Pinboard linker script version " + version + ".");

	// var login = get_login();

	pinboard_object = new Pinboard(username, token, proxy);

	// try:
	// 	if len(login) == 1:
	// 		pinboard_object = pinboard.connect(token=login[0])
	// 	else:
	// 		pinboard_object = pinboard.open(login[0], login[1])
	// except HTTPError, e:
	// 	if e.code == 401:
	// 		err("Oops! Did you enter the correct login information?")
	// 	else:
	// 		err("Error! Unknown exception: " + str(e))
	// except Exception, e:
	// 	err("Error! Unknown exception: " + str(e))
	// finally:
	// 	pass

	// if pinboard_object is not None:
	// 	msg("Logged in!")
	// 	test_suite()
}

function get_login()
{
	var login = get_cached_login();

	if (!login)
	{
		login = get_login_alert();
	}

	return login;
}

function get_login_alert()
{
	// TODO: pr_symbol
	var username = prompt("Username:");
	var password = prompt("Password:");

	if (!username)
	{
		username = "";
	}
	if (!password)
	{
		password = "";
	}

	return [username, password];
}

function get_cached_login()
{
	// TODO: cookies
	return null;
}

//////////
// MAIN //
//////////

// $(function()
// {
// 	startup();
// });