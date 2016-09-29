/*********************************************
*    Declarations
**********************************************/
var h_mod = [1, 1, 1, 0, -1, -1, -1, 0];
var w_mod = [-1, 0, 1, 1, 1, 0, -1, -1];
var recursions;
var gamestate; // 1 for playing (timer running) 
var minecount;
var starttime;
var revealed;

/*********************************************
*    Initial Setup
**********************************************/
window.onload = function ()
{
    w_input = 12;
    h_input = 12;
    m_input = 20;
    generate_minefield( w_input, h_input, m_input );
    document.getElementById("gameboard").style.maxWidth = 24 * w_input + 1;
    fill_minefield( w_input, h_input );
    //recursions = 0;
    minecount = 0;
    gamestate = 2;
    //revealed = 0;
};

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
    if (gamestate != 1)
    {
        gamestate = 1;
        var clock = new Date();
        starttime = clock.getTime();
        setInterval("update_timer()", 1000);
    }
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
    console.log(gamestate);
    console.log( "Clicked on: (" + w + "," + h + ") - " + minefield[ w ][ h ] );
    var src = document.getElementById("minefield_" + w + "_" + h).src;
    if( gamestate == 0)
    {
        return;
    }
    else if( src.search( "flag" ) != -1 )
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
        gamestate = 0;
        console.log("setting to " + gamestate);
        document.getElementById("gameboard-overlay-inner").innerHTML = "Game Over";
        document.getElementById("gameboard-overlay").style.visibility = "visible";
    }
    else
    {
        reveal( w, h );
    }

};

/*********************************************
*    reveals all Mines (called on gameover)
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
    var src = document.getElementById("minefield_" + w + "_" + h).src
    if( src.search( "square.png" ) != -1 )
    {
        document.getElementById("minefield_" + w + "_" + h).src = "images/" + minefield[w][h] + ".png";
        revealed++;
        if(revealed == ( ( w_input * h_input ) - m_input ) )
        {
            gamestate = 3;
            document.getElementById("gameboard-overlay-inner").innerHTML = "You Win!";
            document.getElementById("gameboard-overlay").style.visibility = "visible";
        }
    }
}

/*********************************************
*    Covers Up All Squares
**********************************************/
function fill_minefield( w, h )
{
    var i, j;
    var id = '';
    for( i = 0; i < w; i++ )
    {
        append( "gameboard", "<div id='gameboard_row_" + i + "'>" );
        for( j = 0; j < h; j++ )
        {
            id = "minefield_" + i + "_" + j;
            append( "gameboard_row_" + i, "<span><img id='" + id + "' src='images/square.png' onmousedown='square_click(" + i + "," + j + ",event)'></img></span>" );
        }
       append( "gameboard", "</div>" );
    }
}

/*********************************************
*    Append text to a div
**********************************************/
function append( div, text )
{
    document.getElementById( div ).innerHTML = document.getElementById( div ).innerHTML + text;
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