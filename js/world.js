/* Globals */
var worldContainer;
var freeIconUri = "img/Free-to-play_icon.png";
var memberIconUri = "img/Member_icon.png";
const worldListColumnClass = "ping_table_cell";
const worldListRowClass = "ping_table_row";
const pingIdPrefix = "ping_cell_ping_";

function pingWorldAsync (world) {
    var startTime = (new Date()).getTime(),
        endTime;
    $.ajax({
        type:'HEAD',
        url: "http://" + world.host,
        async: true,
        error: function () {
            endTime = (new Date()).getTime();
            /* Not an accurate representation of what the ping is, as there is no ICMP
             * pinging in javascript */
            world.ping = Math.ceil((endTime - startTime) / 3);

            worldContainer.pingCallback();
        }
    });
}

/* Pings all worlds asynchronously and sets the data */
function pingWorlds(worldContainer) {
    if (worldContainer.isPinging === true)
        return;

    worldContainer.isPinging = true;
    var length = worldContainer.worlds.length;
    for (var index = 0; index < length; index++) {
        pingWorldAsync(worldContainer.worlds[index]);
    }
}

function getWorldContainer() {
    var worldContainer = { worlds: null };
    worldContainer.createTable = createTable;
    worldContainer.updateWorlds = function (newWorlds) {
        this.worlds = newWorlds;
        for (var index = 0; index < this.worlds.length; index++){
            this.worlds[index].ping = null;
        }
    };
    worldContainer.updateTable = updateTable;
    worldContainer.sortByPing = function (a, b) {
        if (a.ping < b.ping)
            return -1;
        if (a.ping > b.ping)
            return 1;
        return 0;
    };
    worldContainer.sortByNumber = function (a, b) {
        if (a.number < b.number)
            return -1;
        if (a.number > b.number)
            return 1;
        return 0;
    };

    /* ping-specific */
    worldContainer.isPinging = false;
    worldContainer.pingCount = 0;
    worldContainer.pingCallback = pingCallback;
    worldContainer.getPlayers = getPlayers;

    return worldContainer;
}

function pingCallback() {
    this.pingCount++;
    if (this.pingCount >= this.worlds.length) {
        this.isPinging = false;
        /* Update table, pinging is over */
        this.getPlayers();
        this.updateTable();
    }
}

function createTable(sorter) {
    if (this.worlds === "undefined")
        return;
    var table = document.getElementById("ping_table_body");

    this.worlds.sort(sorter);
    for (var index = 0; index < this.worlds.length; index++) {
        var world = this.worlds[index];

        var newRow = table.insertRow();
        newRow.classList.add(worldListRowClass);
        newRow.id = "ping_row_" + world.number;

        var typeCell = newRow.insertCell(0);
        var numberCell = newRow.insertCell(1);
        var pingCell = newRow.insertCell(2);
        var activityCell = newRow.insertCell(3);
        var playersCell = newRow.insertCell(4);

        pingCell.id = pingIdPrefix + world.number;

        typeCell.appendChild(getImage(world.type));
        typeCell.classList.add(worldListColumnClass);

        numberCell.innerText = world.number;
        numberCell.classList.add(worldListColumnClass);

        pingCell.classList.add(worldListColumnClass);
        if (world.ping !== null)
        {
            pingCell.innerText = world.ping;
        }
        else {
            pingCell.innerText = "Loading...";
        }

        activityCell.innerText = world.activity;
        if (world.activity.startsWith("PVP")) {
            newRow.classList.add("pvp-world");
        }
        activityCell.classList.add(worldListColumnClass);

        if (world.players) {
            playersCell.innerText = world.players;
        } else {
            playersCell.innerText = "-";
        }
    }
}

function getImage(type) {
    var img = new Image();
    if (type === "Free") {
        img.src = freeIconUri;
    } else {
        img.src = memberIconUri;
    }

    return img;
}

function updateTable() {
    var table = document.getElementById("ping_table");
    for (var index = this.worlds.length; index > 0; index--) {
        table.deleteRow(index);
    }

    this.createTable(this.sortByPing);
}

function getWorlds(worldContainerRef) {
    /* Get HTML for worlds */
    var request = new XMLHttpRequest();
    request.open("GET", 'http://localhost:10101/worlds');
    request.async = true;
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            var worlds = JSON.parse(request.responseText);
            worldContainerRef.updateWorlds(worlds);
            worldContainerRef.createTable(worldContainerRef.sortByNumber);
            pingWorlds(worldContainerRef);
        }
    };
    request.send();
}

function getPlayers() {
    var request = new XMLHttpRequest();
    var wc = this;
    request.open("GET", "http://localhost:10101/players");
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            var players = JSON.parse(request.responseText);
            players.sort(wc.sortByNumber);
            var worldList = wc.worlds;
            worldList.sort(wc.sortByNumber);
            if (players.length !== worldList.length) {
                console.log("World count mismatch");
            }

            for (var index = 0; index < worldList.length; index++) {
                var world = worldList[index];
                var player = players[index];
                if (world.number !== player.number) {
                    console.log("World mismatch on " + world.number + " and " + player.number);
                    continue;
                }
                world.players = player.players;
            }
            worldList.sort(wc.sortByPing);
            wc.worlds = worldList;
        }
    };
    request.send();
}

function populateWorldTable() {
    worldContainer = getWorldContainer();
    getWorlds(worldContainer);

    /* Start timely ping */
    window.setInterval(function () {
        pingWorlds(worldContainer);
    }, 10000);
}

