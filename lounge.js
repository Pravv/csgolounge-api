const cheerio = require('cheerio');
const request = require('request');

const lounge = {};

lounge.url = 'http://csgolounge.com';

lounge.getMatches = function(callback) {
    request(lounge.url, function(error, response, html) {
        if (!error) {
            lounge.matches = [];
            const $ = cheerio.load(html);

            $('#bets > .matchmain').has(".matchleft").each(function(i, elem) {
                const time = $(this).find('.matchheader').find('.whenm').find('.match-time').text();
                const timestamp = Math.round((new Date(time)).getTime() / 1000);

                const $teams = $(this).find('.matchleft').children();//.parent().parent().children();

                const id = parseInt($teams.attr('href').replace('match?m=', ''));

                const $team1 = $teams.children().first().find('.teamtext').children();
                const $team2 = $teams.children().last().find('.teamtext').children();

                const team1 = {
                    name: $team1.first().text(),
                    percentage: 0,//$team1.last().text(),
                    betsValue: 0,
                    logo: $teams.children().first().children().attr('src')
                };
                const team2 = {
                    name: $team2.first().text(),
                    percentage: 0,//$team2.last().text(),
                    betsValue: 0,
                    logo: $teams.children().last().children().attr('src')
                };

                const BOx = parseInt($(this).find('.match').find('.format').text().substr(2));

                let eventLogo = $(this).find('.match').css()['background-image'];
                eventLogo = eventLogo.substr(1, eventLogo.length - 2);

                let winner = 0;
                if ($teams.children().first().children().length === 3) winner = 1;
                else if ($teams.children().last().children().length === 3) winner = 2;

                const addinfo = $(this).find('.matchheader').find('.whenm').children().eq(2).text();

                let status = 'COMPLETED';
                if (winner === 0) {
                    status = $(this).find('.matchheader').find('.whenm').children().eq(1).text() === '\xa0LIVE' ? 'LIVE' : 'UPCOMING';
                }

                lounge.matches.push({
                    id: id,
                    status: status,
                    addInfo: addinfo,
                    time: time,
                    winner: winner,
                    timestamp: timestamp,
                    BO: BOx,
                    eventLogo: eventLogo.substr(4, eventLogo.length - 5),
                    eventName: $(this).find('.matchheader').find('.eventm').text(),
                    teams: { home: team1, away: team2 }
                });
            });

            if (callback) {
                callback(lounge.matches);
            }
        }
    });
};

lounge.matchesDetails = [];

lounge.getMatch = function(matchId, callback) {
    if (lounge.matchesDetails[matchId]) {
        if (callback) {
            callback(lounge.matchesDetails[matchId]);
        }
    } else {
        request(lounge.url + '/match?m=' + matchId, function(error, response, html) {
            if (!error) {

                const $ = cheerio.load(html);

                let winner = 0;

                const $teams = $('.match-box .match-trapezoid-wrapper');
                if ($teams.find('.match-trapezoid-winner-left').length) {
                    winner = 'home';
                }
                if ($teams.find('.match-trapezoid-winner-right').length) {
                    winner = 'away';

                }
                const team1Name = $('.team-a').find('.match-team').find('.match-team-name').text();
                const team2Name = $('.team-b').find('.match-team').find('.match-team-name').text();

                const team1 = {
                    name: team1Name
                };

                const team2 = {
                    name: team2Name
                };

                const match = {
                    id: matchId,
                    winner: winner,
                    teams: [team1, team2]
                };

                lounge.matchesDetails[matchId] = match;
                if (callback) {
                    callback(lounge.matchesDetails[matchId]);
                }
            }
        });
    }
};

lounge.watchers = [];

lounge.watchMatch = function(matchId, callback) {
    lounge.log('Now watching match #' + matchId);
    lounge.watchers[matchId] = setInterval(function() {
        lounge.getMatch(matchId, function(match) {
            if (callback) {
                callback(match);
            }
        });
    }, 1000 * 60); // Every 60 sec
};

lounge.stopWatchMatch = function(matchId) {
    clearInterval(lounge.watchers[matchId]);
    lounge.log('Stopped watching match #' + matchId);
};

lounge.onWin = function(matchId, callback) {
    lounge.watchMatch(matchId, function(match) {
        //if(match.)
        if (match.winner !== 0) {
            lounge.stopWatchMatch(matchId);
            callback(match);
        }
    });
};

lounge.log = function(message) {
    console.log('[lounge] ' + message);
};

module.exports = lounge;