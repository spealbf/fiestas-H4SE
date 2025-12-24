document.getElementById("btn").addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:8080/api/hello");
        const text = await response.text();
        document.getElementById("output").innerText = text;
    } catch (err) {
        console.error(err);
    }
});