function fetchModel(url) {
  return new Promise(function (resolve, reject) {
    // Load via AJAX
    console.log("Fetching data from: ", url);
    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      // if request is not in ready state, continue to watit, continue next step.
      if (this.readyState !== 4) {
        return;
      }
      // if response is in wrong status, handle error.
      if (this.status !== 200) {
        reject(new Error({ status: this.status, statusText: this.statusText }));
      }
      // if response is successful, receive data and send it to client.
      if (this.readyState === 4 && this.status === 200) {
        resolve({ data: JSON.parse(this.responseText) });
      }
    };
    request.open("GET", url, true); // Send GET request to server
    request.send(); // Start the request sending
  });
}

export default fetchModel;
