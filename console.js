function pr(string)
{
	console.log(string);
}

function msg(string)
{
	_print_in_console(string, _pr_symbol());
}

function dbg(string)
{
	_print_in_console(string, _pr_symbol(), 'gray');
}

function err(string)
{
	_print_in_console(string, _pr_symbol(), 'red');
}

function warn(string)
{
	_print_in_console(string, _pr_symbol(), 'orange');
}

function _pr_symbol() 
{
	return "&#9883;" + " ";
}

function _print_in_console(string, symbol, color)
{
	var safestring = $('<div>').text(string).html();
	var symbolstring = (symbol ? symbol + " " : "");
	var p = $("<p>" + symbolstring + safestring + "</p>");
	if (color) { p.css('color', color); }
	$("#console").append(p);
}