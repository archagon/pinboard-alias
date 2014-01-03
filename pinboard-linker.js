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
	* convert to JS (or use a Python to JS converter) for UI prettyness
*/

// TODO: GUI
// TODO: token
// TODO: add "dirty" flag to sync

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function pr_symbol() { return "&#9883;" + " "; }
function pr(string) { $(".terminal").append(string); }
function msg(string) { $(".terminal").append(pr_symbol() + string); }
function err(string) { msg(string); }
function warn(string) { msg(string); }

////////////////////
// MAIN FUNCTIONS //
////////////////////

function startup()
{
	msg("asdf!");
}

//////////
// MAIN //
//////////

$(function()
{
	startup();
});