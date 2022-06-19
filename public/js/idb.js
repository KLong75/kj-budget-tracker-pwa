let db;

const request = indexedDB.open('budget_tracker', 1)

request .onupgradeneeded = function(event) {
  const db = event.target.result
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.online) {
    uploadTransaction();
  }
};

request.onerror = function(event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  const transaction = db.transaction(['new_transaction'], 'readwrite');
  const transactionObjectStore = transaction.objectStore('new_transaction');
  const getAll = transactionObjectStore.getAll();
  getAll.onsuccess = function() {
    if(getAll.result.length > 0) {
      fetch('api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if(serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const transactionObjectStore = transaction.objectStore('new_transaction');
          transactionObjectStore.clear();
          alert('All saved transanctions have been submitted')
        })
        .catch(err => {
          console.log(err);
        });
    }
  }; 
}

window.addEventListener('online', uploadTransaction);