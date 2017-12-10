//var $ = require('jQuery');

// function that takes in user input and converts HTML input to JS
// JS input is used to search for city
module.exports = function test(city) {

        // city variable is set as userInput, gotten from HTML user input
        //var city = city.city;
        // searchtext was found as a method to find the weather forcast
        var searchtext = "select item.condition from weather.forecast     where woeid in (select woeid from geo.places(1) where text='" + city.city + "') and u='f'";
        // JSON data gotten from Yahoo weather API and converted to be usable
        $.getJSON("https://query.yahooapis.com/v1/public/yql?q=" + searchtext + "&format=json").success(function(data){
            console.log(data);
            // Uses city data and Yahoo API JSON query to find temperature results
            return html("The weather right now in " + city.city + " is " + data.query.results.channel.item.condition.temp + "°F and " + data.query.results.channel.item.condition.text + ".");

        });
};

//module.exports =