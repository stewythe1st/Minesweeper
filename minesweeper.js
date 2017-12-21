/*********************************************
*    Declarations
**********************************************/
var h_mod = [1, 1, 1, 0, -1, -1, -1, 0];
var w_mod = [-1, 0, 1, 1, 1, 0, -1, -1];
var recursions;
var gamestate = 0; // 0 = not yet started, 1 = playing, 2 = lost, 3 = won
var minecount = 0;
var starttime;
var revealed;
var animating = 0;

button_str = '<button id="endgame-replay" type="button" onclick="endgame_new_game()">Play Again</button>';

/*********************************************
*    Initial Setup
**********************************************/
window.onload = function ()
{
    m_input = 20;
	h_input = 10;
	w_input = 10;
	generate_minefield( w_input, h_input, m_input );
	document.getElementById( "gameboard" ).style.maxWidth = 24 * h_input + 1;
	fill_minefield( w_input, h_input );
	init_menu();
};

/*********************************************
*    Menu Setup
**********************************************/
function init_menu()
{
	document.getElementById("menu-m").value = m_input;
	document.getElementById("menu-h").value = w_input;
	document.getElementById("menu-w").value = h_input;
}

/*********************************************
*    Reset game with new parameters
**********************************************/
function reset_game()
{
    if( animating )
    {
        return;
    }
	m_input = document.getElementById( "menu-m" ).value;
	w_input = document.getElementById( "menu-h" ).value;
	h_input = document.getElementById( "menu-w" ).value;
	generate_minefield( w_input, h_input, m_input );
	document.getElementById( "gameboard" ).style.maxWidth = 24 * h_input + 1;
	document.getElementById( "gameboard-wrapper" ).style.minWidth = 16 + 24 * h_input + 1;
	fill_minefield( w_input, h_input );
	init_menu();
    fade_out( document.getElementById( "menu" ) );
    gamestate = 0;
    minecount = 0;
    document.getElementById( "timer" ).innerHTML = "0:00";
    document.getElementById( "minecount" ).innerHTML = "0/" + m_input;
}

function endgame_new_game()
{
    fade_out( document.getElementById( "blanket" ) );
    fade_in( document.getElementById( "menu" ) );
}

/*********************************************
*    Handles Updating the Timer every Second
**********************************************/
function update_timer()
{
    if (gamestate == 1)
    {
        var clock = new Date();
        var currenttime = clock.getTime();
        var count = Math.floor((currenttime - starttime) / 1000)
        var sec = ( count % 60 < 10 ? "0" : "" ) + ( count % 60 ).toString();
        var min = ( Math.floor( count / 60 ) ).toString()
        document.getElementById("timer").innerHTML = min + ":" + sec;
    }
}

/*********************************************
*    Handles onClick Events in the Gameboard
**********************************************/
function square_click( w, h, event )
{
    if (gamestate == 0)
    {
        gamestate = 1;
        var clock = new Date();
        starttime = clock.getTime();
        setInterval("update_timer()", 1000);
    }
    else if(gamestate == 2) 
        return;
	switch( event.button )
    {
        case 0:
            square_leftclick( w, h );
            break;
        case 2:
            square_rightclick( w, h);
            break;
        default:
            break;
    }
	goal_test();
}

/*********************************************
*    Handles Rightclick Events (flag mine)
**********************************************/
function square_rightclick( w, h)
{
    var src = document.getElementById("minefield_" + w + "_" + h).src;
    if( src.search( "square" ) != -1)
    {
        document.getElementById("minefield_" + w + "_" + h).src = "images/flag.png";
        minecount++;
    }
    else if( src.search( "flag" ) != -1 )
    {
        document.getElementById("minefield_" + w + "_" + h).src = "images/square.png";
        minecount--;
    }
    console.log(minecount);
    document.getElementById("minecount").innerHTML = ( minecount > 0 ? minecount : 0 ) + "/" + m_input;
}

/*********************************************
*    Handles Leftclick Events (reveal mine)
**********************************************/
function square_leftclick( w, h )
{
    console.log( "Clicked on: (" + w + "," + h + ") - " + minefield[ w ][ h ] );
    var src = document.getElementById("minefield_" + w + "_" + h).src;
    if( src.search( "flag" ) != -1 )
    {
        return;
    }
    else if( minefield[ w ][ h ] == 0 )
    {
        reveal_blanks( w, h );
    }
    else if( minefield[ w ][ h ] == 9)
    {
        reveal_all_mines();
        gamestate = 2;
        document.getElementById( "blanket-text" ).innerHTML = "Game Over<br>" + button_str;
        document.getElementById( "blanket" ).style.visibility = "visible";
        fade_in( document.getElementById( "blanket" ) );
    }
    else
    {
        reveal( w, h );
    }

};

/*********************************************
*    Check if game has been won
**********************************************/
function goal_test()
{
    var i, j;
	var goal = false;
	var end = false;
    for( i = 0; i < w_input && !end; i++ )
    {
        for( j = 0; j < h_input && !end; j++ )
        {
			var square = document.getElementById("minefield_" + i + "_" + j).src;
            if( minefield[ i ][ j ] != 9)
			{
				goal = true;
				if(square.search( "square" ) != -1 || square.search( "flag" ) != -1 )
				{
					goal = false;
					end = true;
				}
			}
        }
    }
	if(!goal)
	{
		return false;
	}
	gamestate = 3;
	reveal_all_mines();
	document.getElementById( "blanket-text" ).innerHTML = "You Win!<br>" + button_str;
    document.getElementById( "blanket" ).style.visibility = "visible";
    fade_in( document.getElementById( "blanket" ) );
	return true;
}

/*********************************************
*    reveals all mines (called on gameover)
**********************************************/
function reveal_all_mines()
{
    var i, j;
    for( i = 0; i < w_input; i++ )
    {
        for( j = 0; j < h_input; j++ )
        {
            if( minefield[ i ][ j ] == 9 )
            {
                reveal( i, j );
            }
        }
    }
}

/*********************************************
*    Recursively Reveals Nearby Blank Squares
**********************************************/
function reveal_blanks( w, h )
{
    var h_new, w_new, i;
	reveal( w, h );
    for( i = 0; i < 8; i++ )
    {
        h_new = h + h_mod[ i ];
        w_new = w + w_mod[ i ];
        if( h_new >= 0 && h_new < h_input && w_new >= 0 && w_new < w_input && minefield[w_new][h_new] != -1)
        {
            reveal( w_new, h_new );
            if( minefield[ w_new ][ h_new ] == "0")
            {
                minefield[ w_new ][ h_new ] = -1; // handled
                reveal_blanks( w_new, h_new );    // recursive call
            }
        }
    }
}

/*********************************************
*    Reveals a Square
**********************************************/
function reveal( w, h )
{
    var el = document.getElementById("minefield_" + w + "_" + h);
    if( el.src.search( "square.png" ) != -1 )
    {
        el.src = "images/" + minefield[w][h] + ".png";
        revealed++;
        if(revealed == ( ( w_input * h_input ) - m_input ) )
        {
            gamestate = 3;
            document.getElementById("blanket-text").innerHTML = "You Win!";
            document.getElementById("blanket").style.visibility = "visible";
			reveal_all_mines();
        }
    }
}

/*********************************************
*    Covers Up All Squares
**********************************************/
function fill_minefield( w, h )
{
	var i, j;
    var parent = document.getElementById( "gameboard" );
    var children = parent.getElementsByTagName( "div" );
    for( i = children.length - 1; i >= 0; i-- )
    {
        if( (children[ i ].id).search( "gameboard_row" ) != -1 )
        {
            parent.removeChild( children[ i ] );
        }
    }
	var html = "";
    for( i = 0; i < w; i++ )
    {
		html += "<div id='gameboard_row_" + i + "'>";
        for( j = 0; j < h; j++ )
        {
			html += "<span><img id='" + "minefield_" + i + "_" + j + "' src='images/square.png' onmousedown='square_click(" + i + "," + j + ",event)'></img></span>";
        }
		html += "</div>";
    }
	parent.innerHTML = parent.innerHTML + html;
}

/*********************************************
*    Creates a JS array for the Minefield
**********************************************/
function generate_minefield( w, h, m )
{
    var i, j, k;
    minefield = new Array( w ); // this is global
    for (i = 0; i < w; i++)
    {
        minefield[ i ] = new Array ( h);
        for( j = 0; j < h; j++ ) 
        {
            minefield[ i ][ j ] = 0;
        }
    }

    /*********************************************
    *    Lay Mines
    **********************************************/
    for( k = 0; k < m; k++ )
    {
        // Pick a random coordinate
        i = ( Math.floor( Math.random() * 1000 ) ) % w;
        j = ( Math.floor( Math.random() * 1000 ) ) % h;
        if( minefield[ i ][ j ] != 9 )
        {
            minefield[ i ][ j ] = 9;
        }
        // If there's already a mine here, try again
        else
        {
            k--;
        }
    }

    /*********************************************
    *    Count Nearby Mines
    **********************************************/
    for( i = 0; i < w; i++ )
    {
        for( j = 0; j < h; j++ )
        {
            for( k = 0; k < 8; k++ )
            {
                // Make sure we're not walking off the array
                // and that this isn't already a mine
                if( i + w_mod[ k ] >= 0 &&
                    i + w_mod[ k ] <  w &&
                    j + h_mod[ k ] >= 0 &&
                    j + h_mod[ k ] <  h &&
                    minefield[ i ][ j ] < 9 )
                {
                    if( minefield[ i + w_mod[ k ] ][ j + h_mod[ k ] ] == 9)
                    {
                        minefield[ i ][ j ] += 1;
                    }
                }
            }
        }
    }

    /*********************************************
    *    Return Minefield
    **********************************************/
    return minefield;
}

/*********************************************
*    Fade Out
**********************************************/
function fade_out( element_out )
{
    animating = 1;
    var op = 1;
    var timer = setInterval(function()
    {
        if( op <= 0.05 )
        {
            clearInterval( timer );
            element_out.style.display = 'none';
            animating = 0;
        }
        element_out.style.opacity = op;
        element_out.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * 0.1;
    }, 20 );
}

/*********************************************
*    Fade In
**********************************************/
function fade_in( element_in )
{
    element_in.style.display = "inline";
    animating = 1;
    var op = 0.1;
    var timer = setInterval(function ()
    {
        if( op >= 1 )
        {
            clearInterval( timer );
            animating = 0;
        }
        element_in.style.opacity = op;
        element_in.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * 0.1;
    }, 20 );
}