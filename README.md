# Minecraft Market
Online market with virtual currency designed for use as a Minecraft server economy

## Features
The Minecraft Market brings your vanilla Minecraft server economy into the 21st century. The Minecraft economy has generally been based on a barter system, which is not ideal for multiple reasons, including the fact that both players in an exchange must have something the other wants and that items are not easily divisible. This system is damaging to both players because it results in many trades failing.

To fix this, the Minecraft Market gives each user virtual currency that can be used to buy and sell goods and services in the Minecraft server economy. For example, if player A wants to buy cake from player B, player A can use the Minecraft Market to transfer $200 to player B and player B can then give the cake to player A. Player B accepts this money because they know that they can use it to buy other goods or services later, in much the same way currency works in real life.

The Minecraft Market also has a feature to list items for sale and have them displayed to potential customers which makes it easy to sell unwanted items. To make it easy to link in-game items to items on the online Market, "quicklinks" are created for each item. The item seller can put the quicklink on a sign (e.g., "@4f3") and the customer can simply type the quicklink into the navbar to find and purchase the item.

## Suggested implementation
At first players may not trust the new currency, thus it won't have much value. In order to fix this, you, as the server administrator, can declare that an item (preferably a non-renewable, non-auto-farmable) resource is worth a certain amount of currency. For example, you might say that a diamond is worth $1,000. Anyone can give you (acting as the bank) a diamond to store securely and you will credit their account with $1,000. At any time, you guarantee that the player can send $1,000 back to you and you will return their diamond. With this system, players can have confidence that their money is in fact backed up by something, even if no other players accept the money. This is similar to the way the gold standard worked in real life.

You'll notice that the configuration file has an option for setting a tax rate on transactions. In most cases, I would imagine you would want to either set the tax rate to 0% or a very low number. This way players will feel more comfortable storing their money in the market knowing that they won't lose any (or very little). If you do decide to have a nonzero tax rate, I recommend justifying it clearly to the players so they know that the money they lose isn't just disappearing. For example, you could use tax money to fund public server projects such as automatic farms or giant buildings everyone can use. In this way, everyone can see real, concrete evidence that their tax money is in fact benefiting them and everyone else.

### Keep in mind this project is still in development and is not intended for use in production. There will be bugs and missing features. I can also not guarantee the security of this application.

# Screenshots
![transactions](https://i.imgur.com/YBO8mbh.png)
![buy](https://i.imgur.com/xCiPozY.png)
![users](https://i.imgur.com/wDOyEuW.png)
![settings](https://i.imgur.com/kTgMo7w.png)

# How to install
## Requirements
- node.js
- MongoDB

## Installation
1) Create a new Mongo Database (such as a database named "market"). This database will contain all of the information for the Minecraft Market.

2) Clone the repository, navigate to it, install dependencies
```sh
$ git clone https://github.com/nicolaschan/market.git
$ cd market
$ node installer.js
```

3) Edit the ```config/server-config.json``` to fit your needs, the most important thing is the database connection information. Configuration instructions are below.

4) Start the app
```sh
$ node index.js
```
If running on port 80, you will probably need to use
```sh
$ sudo node index.js
```

## Configuration
Configuration values are specified in the ```config/server-config.json``` file. Here are the default values with descriptions.
```js
{
    "port": {
        "http": 8080, // Specifies the port to run the HTTP server on
        "https": 8080 // Specifies the port to run the HTTPS server on (if HTTPS is enabled below)
    },
    "https": {
        "enabled": false, // Enabled HTTPS (true or false)
        "key": "keys/*.nc99.co.key", // Path to the SSL key
        "cert": "keys/*.nc99.co.crt" // Path to the SSL certificate
    },
    "mongodb": {
        "host": "10.0.1.100", // MongoDB host URL or IP
        "port": 27017, // Port the MongoDB is running on (default is 27017)
        "database": "market" // Name of the database
    },
    "logger": {
        "filename": "main.log", // Name of the log file (found in "logs/filename")
        "level": "ALL" // Level of logging (options: ALL, TRACE, DEBUG, INFO, WARN, FATAL, OFF)
    },
    "captcha": {
        "enabled": false, // Require Google reCAPTCHA in order to create an account
        "site_key": "site key", // Site key (provided by reCAPTCHA)
        "secret_key": "secret key" // Secret key (provided by reCAPTCHA)
    },
    "page_text": {
        "title": "Minecraft Market", 
        "footer": "Market for nc99 Minecraft Servers"
    },
    "admins": ["market"], // Bank IDs of users that should have admin privileges
    "money_factory": ["factory"], // Bank IDs of users that should have unlimited money
    "tax": {
        "rate": 0.05, // Tax rate as proportion (e.g., 0.05 = 5% tax rate)
        "recipient": "tax" // Bank ID of the user that receives tax money
    },
    "default_tagline": "A market user", // Default tagline
    "user_not_found": "[ ? ]" // What displays when a user cannot be found
}
```
