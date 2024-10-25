function groupPlayersByClan(playerList, clans) { 
    let clanToPlayers = {};
    for (let clanName in clans) {
        clanToPlayers[clanName] = [];
    }

    let otherPlayers = [];

    for (let playerName of playerList) {
        let foundClan = null;
        for (let clanName in clans) {
            let clan = clans[clanName];
            for (let tag of clan.tags) {
                if (playerName.includes(tag)) {
                    foundClan = clanName;
                    break;
                }
            }
            if (foundClan) {
                break;
            }
        }
        if (foundClan) {
            clanToPlayers[foundClan].push(playerName);
        } else {
            otherPlayers.push(playerName);
        }
    }

    return { clanToPlayers, otherPlayers };
}
