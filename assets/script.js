
document.addEventListener("DOMContentLoaded", function () {

    // SAMPLE EQUIPMENT DATA
    const equipmentData = {
        // CA
        laptop: {
            name: "Laptop",
            category: "Laptop",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 5,
            image: "/assets/images/CA/Laptop.webp",
            description: "A laptop for programming, research, school projects, and other academic activities."
        },

        binoculars: {
            name: "Binoculars",
            category: "Binoculars",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 2,
            image: "/assets/images/CA/Binoculars.jpg",
            description: "A binocular for outdoor observation, nature studies, and recreational activities."
        },

        scale: {
            name: "Digital Scale",
            category: "Digital Scale",
            college: "College of Agriculture",
            condition: "Fair",
            quantity: 3,
            image: "/assets/images/CA/Digital Weighting Scale.jpg",
            description: "A digital scale for precise weight measurements in laboratory and academic settings."
        },

        tape: {
            name: "Tape Measure",
            category: "Tape Measure",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 3,
            image: "/assets/images/CA/Measuring Tape.webp",
            description: "A tape measure for measuring lengths and distances in various academic and practical applications."
        },

        shears: {
            name: "Pruning Shears",
            category: "Pruning Shears",
            college: "College of Agriculture",
            condition: "Fair",
            quantity: 8,
            image: "/assets/images/CA/Pruning Shears.jpg",
            description: "Pruning shears for trimming plants and trees in agricultural and landscaping settings."
        },

        phmeter: {
            name: "Soil pH Meter",
            category: "Soil pH Meter",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 2,
            image: "/assets/images/CA/soil ph meter.jpg",
            description: "A soil pH meter for measuring the acidity or alkalinity of soil in agricultural and environmental studies."
        },

        auger: {
            name: "Sampling Auger",
            category: "Sampling Auger",
            college: "College of Agriculture",
            condition: "Fair",
            quantity: 2,
            image: "/assets/images/CA/Sampling Auger.jpg",
            description: "A sampling auger for collecting soil samples in agricultural and environmental studies."
        },

        wheelbarrow: {
            name: "Wheelbarrow",
            category: "Wheelbarrow",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 3,
            image: "/assets/images/CA/Wheelbarrow.jpg",
            description: "A wheelbarrow for transporting materials in agricultural and landscaping settings."
        },

        moisture: {
            name: "Soil Moisture Sensor",
            category: "Soil Moisture Sensor",
            college: "College of Agriculture",
            condition: "Good",
            quantity: 2,
            image: "/assets/images/CA/Soil_moisture_sensor.JPG",
            description: "A soil moisture sensor for measuring the water content of soil in agricultural and environmental studies."
        },

        // CArch

        scale_ruler: {
            name: "Scale Ruler",
            category: "Scale Ruler",
            college: "College of Architecture",
            condition: "Good",
            quantity: 2,
            image: "/assets/images/CArch/Architect Scale Ruler.webp",
            description: "A scale ruler for precise measurements in laboratory and academic settings."
        },

        mat: {
            name: "Cutting Mat",
            category: "Cutting Mat",
            college: "College of Architecture",
            condition: "Good",
            quantity: 2,
            image: "/assets/images/CArch/Cutting Mat.jpg",
            description: "A cutting mat for protecting surfaces during drafting and design work."
        },

        board: {
            name: "Drawing Board",
            category: "Drawing Board",
            college: "College of Architecture",
            condition: "Fair",
            quantity: 3,
            image: "/assets/images/CArch/Drawing Board.png",
            description: "A drawing board for creating architectural and design sketches."
        },

        laptop2: {
            name: "Laptop",
            category: "Laptop",
            college: "College of Architecture",
            condition: "Good",
            quantity: 3,
            image: "/assets/images/CArch/Laptop2.webp",
            description: "A laptop for programming, research, school projects, and other academic activities."
        }   
    };

    // LOGOUT BUTTON
    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            alert("Logout will be connected to the login system later.");
        });
    }

    // EQUIPMENT CATALOG FUNCTIONS
    const equipmentGrid = document.getElementById("equipmentGrid");

    if (equipmentGrid) {
        const cards = Array.from(
            equipmentGrid.querySelectorAll(".catalog-card")
        );

        const searchInput = document.getElementById("searchInput");
        const sortSelect = document.getElementById("sortSelect");
        const resultCount = document.getElementById("resultCount");
        const noResults = document.getElementById("noResults");
        const resetFilters = document.getElementById("resetFilters");

        const selectedFilters = {
            category: "",
            condition: "",
            college: ""
        };

        const filterButtons = document.querySelectorAll(
            "[data-filter-type][data-value]"
        );

        function updateEquipment() {
            const searchText = searchInput.value.toLowerCase().trim();

            let visibleCards = cards.filter(function (card) {
                const name = card.dataset.name.toLowerCase();
                const category = card.dataset.category.toLowerCase();
                const condition = card.dataset.condition.toLowerCase();
                const college = card.dataset.college.toLowerCase();

                const matchesSearch =
                    name.includes(searchText) ||
                    category.includes(searchText);

                const matchesCategory =
                    !selectedFilters.category ||
                    category === selectedFilters.category.toLowerCase();

                const matchesCondition =
                    !selectedFilters.condition ||
                    condition === selectedFilters.condition.toLowerCase();

                const matchesCollege =
                    !selectedFilters.college ||
                    college === selectedFilters.college.toLowerCase();

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesCondition &&
                    matchesCollege
                );
            });

            // SORT EQUIPMENT
            if (sortSelect.value === "name-asc") {
                visibleCards.sort(function (a, b) {
                    return a.dataset.name.localeCompare(b.dataset.name);
                });
            } else if (sortSelect.value === "name-desc") {
                visibleCards.sort(function (a, b) {
                    return b.dataset.name.localeCompare(a.dataset.name);
                });
            } else {
                const conditionOrder = {
                    good: 1,
                    fair: 2,
                    poor: 3
                };

                visibleCards.sort(function (a, b) {
                    return (
                        conditionOrder[a.dataset.condition.toLowerCase()] -
                        conditionOrder[b.dataset.condition.toLowerCase()]
                    );
                });
            }

            // HIDE ALL CARDS FIRST
            cards.forEach(function (card) {
                card.style.display = "none";
            });

            // SHOW MATCHING CARDS IN SORTED ORDER
            visibleCards.forEach(function (card) {
                card.style.display = "";
                equipmentGrid.appendChild(card);
            });

            resultCount.textContent =
                "Showing " + visibleCards.length +
                " of " + cards.length + " equipment item(s)";

            noResults.style.display =
                visibleCards.length === 0 ? "block" : "none";
        }

        // CATEGORY, CONDITION, AND COLLEGE FILTERS
       
// COLLEGE DROPDOWN
const collegeSelect = document.getElementById("collegeSelect");

if (collegeSelect) {
    collegeSelect.addEventListener("change", function () {
        selectedFilters.college = this.value;
        updateEquipment();
    });
}

// CATEGORY DROPDOWN
const categorySelect = document.getElementById("categorySelect");

if (categorySelect) {
    categorySelect.addEventListener("change", function () {
        selectedFilters.category = this.value;
        updateEquipment();
    });
}


// CONDITION FILTER

const conditionButtons = document.querySelectorAll(
    '[data-filter-type="condition"]'
);

conditionButtons.forEach(function (button) {
    button.addEventListener("click", function () {
        selectedFilters.condition = button.dataset.value;

        conditionButtons.forEach(function (conditionButton) {
            conditionButton.classList.toggle(
                "active",
                conditionButton.dataset.value === selectedFilters.condition
            );
        });

        updateEquipment();
    });
});


        // LIVE SEARCH
        searchInput.addEventListener("input", updateEquipment);

        // SORTING
        sortSelect.addEventListener("change", updateEquipment);

        // RESET FILTERS AND SEARCH
        resetFilters.addEventListener("click", function () {
            selectedFilters.category = "";
            selectedFilters.condition = "";
            selectedFilters.college = "";

            searchInput.value = "";
            sortSelect.value = "popular";

            filterButtons.forEach(function (button) {
                button.classList.toggle("active", button.dataset.value === "");
            });

            updateEquipment();
        });

        updateEquipment();
    }

    // EQUIPMENT DETAILS PAGE
    const equipmentName = document.getElementById("equipmentName");

    if (equipmentName) {
        const params = new URLSearchParams(window.location.search);
        const itemId = params.get("item");
        const item = equipmentData[itemId];

        const image = document.getElementById("equipmentImage");
        const category = document.getElementById("equipmentCategory");
        const description = document.getElementById("equipmentDescription");
        const college = document.getElementById("equipmentCollege");
        const condition = document.getElementById("equipmentCondition");
        const quantity = document.getElementById("equipmentQuantity");
        const status = document.getElementById("equipmentStatus");
        const requestButton = document.getElementById("requestButton");
        const requestMessage = document.getElementById("requestMessage");

        if (item) {
            document.title = item.name + " Details | CampusEquip";

            image.src = item.image;
            image.alt = item.name;
            image.style.display = "block";

            category.textContent = item.category;
            equipmentName.textContent = item.name;
            description.textContent = item.description;
            college.textContent = item.college;
            condition.textContent = item.condition;
            quantity.textContent = item.quantity;

            status.textContent =
                item.quantity > 0 ? "Available" : "Unavailable";

            if (item.quantity <= 0) {
                requestButton.disabled = true;
                requestButton.textContent = "Unavailable";
            }

            requestButton.addEventListener("click", function () {
                requestMessage.textContent =
                    "Please sign up or log in to continue with your equipment request.";
            });

        } else {
            equipmentName.textContent = "Equipment Not Found";
            description.textContent =
                "Please return to the equipment catalog and select an item.";

            image.style.display = "none";
            category.textContent = "";
            document.querySelector(".details-specs").style.display = "none";
            requestButton.style.display = "none";
        }
    }
});
