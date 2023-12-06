window.onload = function(){
	//käin lehe läbi, kogun kokku kõik pisikesed galeriielemendid ja määran kõigile hiirekliki kuulaja!
	let allThumbs = document.querySelector(".gallery").querySelectorAll(".thumbs");
	console.log(allThumbs);
	for (let i = 0; i < allThumbs.length; i ++){
		allThumbs[i].addEventListener("click", openModal);
	}
}

function openModal(e){
	document.querySelector("#modalImage").src = "/gallery/normal/" + e.target.dataset.filename;
	document.querySelector("#modalCaption").innerHTML = e.target.alt;
	document.querySelector("#modal").showModal();
	document.querySelector("#modalClose").addEventListener("click", closeModal);
	document.querySelector("#modalImage").addEventListener("click", closeModal);
}

function closeModal(){
	console.log('here')
	document.querySelector("#modal").close();
	document.querySelector("#modalImage").src = "/pics/empty.png";
	document.querySelector("#modalCaption").innerHTML = "Galeriipilt";
}