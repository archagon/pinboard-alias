"""
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
"""

# TODO: GUI
# TODO: token
# TODO: add "dirty" flag to sync

import pinboard

import re
from urllib2 import HTTPError
from datetime import date

# command line imports
from getpass import getpass

###########################
# CONFIGURABLE PARAMETERS #
###########################

settings_tag_name = "pinboard-linker-settings"

###############################
# NON-CONFIGURABLE PARAMETERS #
###############################

version = "0.1"

###########
# REGEXES #
###########

version_regex = re.compile(r"""
							^
							\s*			# optional whitespace at beginning
							v 			# version indicator
							\s+			# whitespace separator
							(.*?)		# version number (because I'm lazy)
							\s*			# optional whitespace at end
							$
							""", re.VERBOSE)
link_regex = re.compile(r"""
							^
							\s*			# optional whitespace at beginning
							([^\s,]+)	# first tag
							\s+			# whitespace separator
							(<?>)		# matches either '<>' or '>'; '<' does not exist by itself
							\s+			# whitespace separator
							([^\s,]+)	# second tag
							\s*			# optional whitespace at end
							$
							""", re.VERBOSE)

##################
# GLOBAL OBJECTS #
##################

pinboard_object = None
synonym_map = {}
dirty = False

####################
# HELPER FUNCTIONS #
####################

def pr_symbol():
	return u"\U0001F531" + "  "
def pr(str):
	print(str)
def msg(msg):
	print(pr_symbol() + msg)
def err(err):
	return msg(err)
def warn(warn):
	return msg(warn)

##################
# MAIN FUNCTIONS #
##################

def startup():
	global pinboard_object

	msg("Pinboard linker script version " + version + ".")

	login = get_login()

	try:
		if len(login) == 1:
			pinboard_object = pinboard.connect(token=login[0])
		else:
			pinboard_object = pinboard.open(login[0], login[1])
	except HTTPError, e:
		if e.code == 401:
			err("Oops! Did you enter the correct login information?")
		else:
			err("Error! Unknown exception: " + str(e))
	except Exception, e:
		err("Error! Unknown exception: " + str(e))
	finally:
		pass

	if pinboard_object is not None:
		msg("Logged in!")
		test_suite()

def test_suite():
	get_settings()
	# add_link("programming", "game-programming")
	# add_link("games", "gaming", True)
	# sync_settings()
	print_settings()
	sync_settings()

# add the link to the local settings; don't forget to call sync and then commit!
def add_link(tag1, tag2, bidirectional=False):
	if tag1 in synonym_map:
		synonym_map[tag1].add(tag2)
	else:
		synonym_map[tag1] = set([tag2])
	if bidirectional:
		add_link(tag2, tag1, False)
	global dirty
	dirty = True

# delete the link from the local settings; don't forget to call sync and then commit!
def del_link(tag1, tag2):
	if tag1 in synonym_map:
		if tag2 in synonym_map[tag1]:
			synonym_map[tag1].remove(tag2)
			if len(synonym_map[tag1]) == 0:
				del synonym_map[tag1]
	global dirty
	dirty = True

def print_settings():
	msg("Local settings:")
	encoded_settings = encode_settings()
	encoded_settings = encoded_settings.replace(" ,", "")
	split_settings = encoded_settings.split("\n")
	for i in range(len(split_settings)):
		if i == 0:
			pass
		else:
			msg("    " + "* " + split_settings[i])

# convert the local settings dictionary to string format
def encode_settings():
	encoded_settings = "v" + " " + version + " " + ","
	dupe_keys = set([])
	for from_key in synonym_map.keys():
		if from_key in dupe_keys:
			continue
		for to_key in synonym_map[from_key]:
			if (to_key in synonym_map) and (from_key in synonym_map[to_key]):
				encoded_settings += ("\n" + from_key + " <> " + to_key + " ,")
				dupe_keys.add(to_key)
			else:
				encoded_settings += ("\n" + from_key + " > " + to_key + " ,")
	return encoded_settings

# convert a settings string to the local settings dictionary
def decode_settings(settings):
	if settings:
		lines = settings.split(',')
		for i in range(len(lines)):
			line = lines[i]
			if i == 0:
				match = version_regex.match(line)
				if match is not None:
					version = match.group(1)
					msg("Server-side version: " + version)
			else:
				match = link_regex.match(line)
				if match is not None:
					tag1 = match.group(1)
					tag2 = match.group(3)
					direction = match.group(2)
					bidirectional = (direction == "<>")
					add_link(tag1, tag2, bidirectional)
	global dirty
	dirty = False

# propagate the local settings; don't forget to sync first!
def commit_settings():
	pass

def verify_settings():
	pass

def verify_tag(tag):
	pass

# pull the settings from the server, creating the settings tag if necessary
def get_settings():
	# use a to-date in the future to ensure that the request is set to "all" rather than "recent"
	future_date = str(date.today().year + 100) + "1" + "-" + "1"
	posts = pinboard_object.posts(tag=settings_tag_name, todt=future_date)

	if posts is not None and len(posts) > 0:
		if len(posts) > 1:
			warn("Found more than one tag with name \"" + settings_tag_name + "\", using first one found.")
		decode_settings(posts[0]["extended"])
	else:
		msg("Settings file not found, creating new one with tag name \"" + settings_tag_name + "\".")
		sync_settings()

# push the local settings to the server; do this before committing
def sync_settings():
	if not dirty:
		msg("Sync not necessary.")
		return

	msg("Syncing settings...")

	# TODO: try/except
	pinboard_object.add(url="file://" + settings_tag_name,
						tags=(settings_tag_name),
						description="Pinboard Linker Settings",
						extended=encode_settings(),
						replace=True)

	global dirty
	dirty = False

	msg("Done!")

def get_login():
	login = cached_login()
	if login is None:
		login = get_login_commandline();
	return login

def get_login_commandline():
	# TODO: pr_symbol
	username = raw_input("Username: ")
	password = getpass(prompt="Password: ")
	return (username, password)

def cached_login():
	try:
		cached_token_file = open("api.token", "r")
	except IOError, e:
		return None
	else:
		token = cached_token_file.read()
		token = token.strip()
		# TODO: use parens
		return [token]

########
# MAIN #
########

if __name__ == "__main__":
	startup()