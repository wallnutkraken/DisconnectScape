/* Globals */
var worldContainer;
var freeIconUri = "img/Free-to-play_icon.png";
var memberIconUri = "img/Member_icon.png";
const worldListColumnClass = "ping_table_cell";
const worldListRowClass = "ping_table_row";

function pingWorldAsync () {
    var startTime = (new Date()).getTime(),
        endTime;

    $.ajax({
        type:'GET',
        url: this.host,
        async: true,
        success : function() {
            endTime = (new Date()).getTime();
            this.ping = endTime - startTime;
        }
    });
}

/* Pings all worlds asynchronously and sets the data */
function pingWorlds(worlds) {
    var length = worlds.length;
    for (var index = 0; index < length; index++) {
        worlds[index].pingWorldAsync();
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

    return worldContainer;
}

function createTable() {
    if (this.worlds === "undefined")
        return;
    var table = document.getElementById("ping_table_body");

    this.worlds.sort(this.sortByNumber);
    for (var index = 0; index < this.worlds.length; index++) {
        var world = this.worlds[index];

        var newRow = table.insertRow();
        newRow.classList.add(worldListRowClass);
        table.id = "ping_row_" + world.number;

        var typeCell = newRow.insertCell(0);
        var numberCell = newRow.insertCell(1);
        var pingCell = newRow.insertCell(2);
        var activityCell = newRow.insertCell(3);

        pingCell.id = "ping_cell_ping_" + world.number;

        typeCell.appendChild(getImage(world.type));
        //typeCell.innerHTML = getImage(world.type);
        typeCell.classList.add(worldListColumnClass);
        numberCell.innerText = world.number;
        numberCell.classList.add(worldListColumnClass);
        pingCell.classList.add(worldListColumnClass);
        if (world.ping !== null)
            pingCell.innerText = world.ping;
        else
            pingCell.innerText = "Loading...";
        activityCell.innerText = world.activity;
        activityCell.classList.add(worldListColumnClass);
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
    /* TODO */
}

function getWorlds(worldContainerRef) {
    /* Get HTML for worlds */
    var request = new XMLHttpRequest();
    request.open("GET", 'http://localhost:10101/worlds');
    request.async = true;
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            var responseJson = request.responseText;
            worldContainerRef.updateWorlds(JSON.parse(responseJson));
            worldContainerRef.createTable();
        }
    };
    request.send();
}

function populateWorldTable() {
    worldContainer = getWorldContainer();
    getWorlds(worldContainer)
}
