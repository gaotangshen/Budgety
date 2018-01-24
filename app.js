var budgetController = (function () {
  var Income = function(id, value, description) {
    this.id = id;
    this.value = value;
    this.description = description;
  };

  var Expense = function(id, value, description) {
    this.id = id;
    this.value = value;
    this.description = description;
    this.percentage = -1;
  };

  Expense.prototype.calPercentage = function(totalIncome) {
    if (totalIncome > 0) {
      this.percentage = Math.round(this.value / totalIncome * 100);
    } else {
      this.percentage = -1;
    }    
  }

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  }

  var calculateTotal = function (type) {
    var sum = 0;
    data.allItems[type].forEach(function(cur) {
      sum += cur.value;
    });

    data.totals[type] = sum;
  }

  var data = {
    allItems: {
      inc: [],
      exp: [],
    },
    totals: {
      inc: 0,
      exp: 0,
    },
    budget: 0,
    percentage: -1
  }


  return {
    addItem: function(input) {
      var newItem;

      if (data.allItems[input.type].length > 0) {
        ID = data.allItems[input.type][data.allItems[input.type].length - 1].id + 1;
      } else {
        ID = 0;
      }

      if (input.type === 'inc') {
        newItem = new Income(ID, input.value, input.description);
        
      } else {
        newItem = new Expense(ID, input.value, input.description); 
      }

      data.allItems[input.type].push(newItem);
      return newItem;
    },

    calculateBudget: function() {
      calculateTotal('inc');
      calculateTotal('exp');

      data.budget = data.totals.inc - data.totals.exp;

      if (data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      } else {
        data.percentage = -1;
      }
    },

    calculatePercentage: function() {
      data.allItems.exp.forEach(function(curr) {
        curr.calPercentage(data.totals.inc);
      });
    },

    deleteItem: function(type, id) {
      var ids, idx;
      ids = data.allItems[type].map(function(curr) {
        return curr.id;
      });

      idx = ids.indexOf(id);
      if (idx !== -1) {
        data.allItems[type].splice(idx, 1);
      }
    },

    getPercentages: function() {
      var allPerc = data.allItems.exp.map(function(cur) {
        return cur.getPercentage();
      });
      return allPerc;
    },

    getBudget: function() {
      return {
        inc: data.totals.inc,
        exp: data.totals.exp,
        budget: data.budget,
        percentage: data.percentage
      };
    },
  }
})();

/* UI CONTROLLER */
var UIController = (function () {
  var DOMStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expensesLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  var formatNumber = function(number, type) {
    var formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    return (type === 'inc' ? '+' : '-') + ' ' + formatter.format(number);
  };

  var nodeListForeach = function(fields, callback) {
    for(var i=0; i<fields.length; i++) {
      callback(fields[i], i);
    }
  }

  return {
    getInput: function() {
      return {
        type : document.querySelector(DOMStrings.inputType).value,
        description : document.querySelector(DOMStrings.inputDescription).value,
        value : parseInt(document.querySelector(DOMStrings.inputValue).value),
      }
    },

    addListItem: function(obj, type) {
      var element, html, newHtml;

      if (type === 'inc') {
        element = DOMStrings.incomeContainer;
        
        html = '<div class="item clearfix" id="inc-%id%"> <div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      } else if (type === 'exp') {
        element = DOMStrings.expensesContainer;
        
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }
      
      newHtml = html.replace('%id%', obj.id).replace('%description%', obj.description).replace('%value%', formatNumber(obj.value, type));
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },
    
    deleteListItem: function(id) {
      var el = document.getElementById(id);
      el.parentNode.removeChild(el);
    },

    clearFields: function() {
      var fields, fieldsArr;
      fields = document.querySelectorAll(DOMStrings.inputValue + ',' + DOMStrings.inputDescription);
      fieldsArr = Array.prototype.slice.call(fields);
      fieldsArr.forEach(function(curr){
        curr.value = '';
      });

      fieldsArr[0].focus();
    },

    displayBudget: function(obj) {
      var type;
      type = obj.budget > 0 ? 'inc' : 'exp';

      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.inc, 'inc');
      document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.exp, 'exp');
      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(Math.abs(obj.budget), type);

      if (obj.percentage > 0) {
        document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + '%';
      } else {
        document.querySelector(DOMStrings.percentageLabel).textContent = '---';
      }
      
    },

    displayPercentages: function(percentages) {
      var fields = document.querySelectorAll(DOMStrings.expensesPercLabel);

      nodeListForeach(fields, function(cur, index) {
        if (percentages[index] > 0) {
          cur.textContent = percentages[index] + '%';
        } else {
          cur.textContent = '---';
        }
      });
    },

    dispalyMonth: function() {
      var now, year, month, months;
      now = new Date();
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      year = now.getFullYear();
      month = now.getMonth();
      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ' ' + year;
    },

    changeType: function() {
      var inputFields;

      inputFields = document.querySelectorAll(DOMStrings.inputDescription + ',' + DOMStrings.inputValue + ',' + DOMStrings.inputType);
      inputFields.forEach(function(curr) {
        curr.classList.toggle('red-focus');
      });
      document.querySelector(DOMStrings.inputBtn).classList.toggle('red');

    },

    getDOMString: function() {
      return DOMStrings;
    }
  };
})();





var controller = (function (budgetCtrl, UICtrl) {

  var DOM = UICtrl.getDOMString();

  var setupEventListener = function() {
    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    document.addEventListener('keydown', function (e) {
      if (e.keyCode == 13 || event.witch == 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
  };

  var ctrlDeleteItem = function(event) {
    var itemID, splitID; 
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
    
    if (itemID) {
      splitID = itemID.split('-');
      
      budgetCtrl.deleteItem(splitID[0], parseInt(splitID[1]));

      UICtrl.deleteListItem(itemID);

      updateBudget();

      // update percentage
      updatePercentage();
    }
  };

  // add budget
  var ctrlAddItem = function() {
    //get input
    var input = UICtrl.getInput();
    if (input.description && !isNaN(input.value) && input.value > 0) {
      // add item
      var item = budgetCtrl.addItem(input);

      // update UI
      UICtrl.addListItem(item, input.type);

      UICtrl.clearFields();

      // update budget
      updateBudget();

      // update percentage
      updatePercentage();
    }
  };

  // update budget
  var updateBudget = function() {
    budgetCtrl.calculateBudget();
    var budget = budgetCtrl.getBudget();
    UICtrl.displayBudget(budget);
  };

  // update percentage
  var updatePercentage = function() {
    budgetCtrl.calculatePercentage();
    var percentages = budgetCtrl.getPercentages();
    UICtrl.displayPercentages(percentages);
  };

  return {
    init: function() {
      console.log("application start");
      UICtrl.dispalyMonth();
      //display budget
      UICtrl.displayBudget({
        inc: 0,
        exp: 0,
        budget: 0,
        percentage: -1
      });


      setupEventListener();
    }
  };
})(budgetController, UIController);

controller.init();