// Electron
const { ipcRenderer } = require('electron');
var request = require("request");

function init() {
    createEventListeners();
}

function createEventListeners() {
    var list = document.getElementById('menu-screen').getElementsByClassName('menu-icon');
    for (i = 0; i < list.length; i++) {
        var menuListing = list[i].id;
        list[i].addEventListener('click', function() {
            ipcRenderer.sendSync(menuListing);
        });
    }
}

//Pulls query response object orderMaxs
function pullOrderMaxs(){
    var output = ipcRenderer.sendSync('orderMaxs');
    
    document.getElementById('dessertAmount').innerHTML=output['desserts'];
    document.getElementById('sideAmount').innerHTML=output['sides'];
    document.getElementById('entreeAmount').innerHTML=output['entrees'];
    document.getElementById('drinkAmount').innerHTML=output['drinks'];
    //document.getElementById('totalAmount').innerHTML=totalSales;

}
pullOrderMaxs();
init();

// Request and display search results
function search(queryString) {
    var data = ipcRenderer.sendSync("search", queryString);  
    if (data.type == "error") {		
        alert(data.error.toString());		
        return;		
    }		
    // data should be formatted as an array of rows
    var results = document.getElementById("results");

    // Clear any previous results
    while (results.firstChild) {
        results.removeChild(results.firstChild);
    }
    for (var i = 0; i < data.data.length; i++) {
        var row = data.data[i];
        // Create the dom element
        var rowElement = document.createElement("div");
        // Give it the result-row class
        rowElement.classList.add("itemButton");
        // Add our row data
        rowElement.innerHTML = `
            <div class="itemDelete" data-item="${row["side_id"]}" data-type="${row.type}">X</div>

            <div class="list-item-name">
                ${row.description}	
            </div>
            <div class="list-item-price">
                $${row["side_cost"]}
            </div>
        `;
        rowElement.style.backgroundImage = "url('../kiosk/images/items/" + (row.type.charAt(0).toUpperCase() + row.type.slice(1)) + "s/" + row.description + ".jpg')";

        // Append to results
        results.appendChild(rowElement);
    }
}

document.addEventListener("click", (e) => {		
    if (e.target.attributes["data-item"]) {		
        if (confirm("Are you sure?")) {		
            console.log(e.target.attributes["data-item"].value);		
            ipcRenderer.sendSync("deleteItem", e.target.attributes["data-type"].value, e.target.attributes["data-item"].value);
            e.target.closest(".itemButton").remove();		
        }		
    }		
}, true);

// Handle ui search events
document.getElementById("sqlBoxSearch").addEventListener("click", function() {
    var queryString = document.getElementById("sqlBoxInput").value;

    search(queryString);
});

/**
 * Request the aggregation data for a specified date range
 * 
 * @param {string} type ("completionTime"|"completionOrderTime")
 * @param {string} start ISO formatted date
 * @param {string} end ISO formatted date
 * 
 * @param {string} table dessert|drink|entree|side. Only applied if type == "completionOrderTime"
 * @param {string} aggSearch search term to use when finding the order item. Only applied if type == "completionOrderTime"
 */
function aggregate(type, start, end, table, aggSearch) {
    var aggregation = ipcRenderer.sendSync("aggregate", type, start, end, table, aggSearch);

    document.getElementById("aggregationResults").innerHTML = aggregation.average_time + " seconds";
}

// Handle the aggregate click event
document.getElementById("aggregate").addEventListener("click", function() {
    var type = document.getElementById("aggregateBy").value;
    var start = document.getElementById("dateStartInput").value;
    var end = document.getElementById("dateEndInput").value;

    var table = document.getElementById("aggregateTable").value;
    var aggSearch = document.getElementById("aggregateSearch").value;

    aggregate(type, start, end, table, aggSearch);
});

document.getElementById("aggregateBy").addEventListener("change", function () {
    var type = document.getElementById("aggregateBy").value;

    // Only show the search options if we are aggregating by order
    if (type == "completionOrderTime") {
        document.getElementById("aggregateByOrder").style.display = "block";
    }else{
        document.getElementById("aggregateByOrder").style.display = "none";
    }
});

function createMenuItem(data) {
    // Apply defaults for missing fields
    data = Object.assign({
        table: "dessert",
        name: "",
        description: "",
        calories: 0,
        cost: 0,
        stock: 0
    }, data);

    return ipcRenderer.sendSync("create", data);
}

document.getElementById("create").addEventListener("click", function() {
    var response = createMenuItem({
        table: document.getElementById("itemTable").value,
        name: document.getElementById("itemName").value,
        description: document.getElementById("itemDesc").value,
        cost: document.getElementById("itemCost").value,
        stock: document.getElementById("itemStock").value,
        calories: document.getElementById("itemCalories").value
    });

    alert(response.message);
});


document.addEventListener("click", (e) => {
    if (e.target.classList.contains("admin-tab-title")) {
        document.querySelector("#admin-tabs").style.left = "-" + (parseInt(e.target.getAttribute("data-tab") * 100)) + "%";
    }
}, true);