document.addEventListener('DOMContentLoaded', () => {
 
    document.querySelector('#compose-post-form').onsubmit = send_post;

    load_posts();
});


function send_post(e) {

    e.preventDefault();

    const _body = document.querySelector('#compose-post-body').value;
    const csrftoken = getCookie('csrftoken');

    fetch('/posts', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        mode: 'same-origin', // Do not send CSRF token to another domain.
        body: JSON.stringify({
            body: _body
        })
      }).then(response => response.json())
      .then(result => {
          console.log(result);
          const errorMessageElement = document.querySelector('#error-message');
          if (result.hasOwnProperty('error')){
            errorMessageElement.innerHTML = result.error;
            errorMessageElement.style.display = 'block';
        } else {
            errorMessageElement.innerHTML = '';
            errorMessageElement.style.display = 'none';
            load_posts();
        }     
      }).catch((error) => {
        console.log(`error: ${error}`);
      });
}


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function load_posts() {

    document.querySelector('#error-message').style.display = 'none';
    document.querySelector('#error-message').innerHTML = '';

    document.querySelector('#compose-post-body').value = '';
    document.querySelector('#posts-view').innerHTML = '';

    get_posts();

}

function get_posts() {

    fetch(`/posts`)
    .then(response => response.json())
    .then(posts => {
      
      const postsContainer = document.querySelector('#posts-view');
      postsContainer.value = '';

      posts.forEach((post) => {
  
        postElement = create_post_box(post);
        postsContainer.appendChild(postElement);
  
      });
  
      
    }).catch((error) => {
      console.log(`error: ${error}`);
    });

}

function create_post_box(post) {

    const postBoxElement = document.createElement('div');
    postBoxElement.setAttribute("class", "card");

    const cardBodyElement = document.createElement('div');
    cardBodyElement.setAttribute("class", "card-body");

    const cardTitleElement = document.createElement('h5');
    cardTitleElement.setAttribute("class", "card-title");
    cardTitleElement.innerHTML = post.poster;

    const bodyContentElement = document.createElement('div');

    bodyContentElement.innerHTML = `<p>${post.body}</p>`;

    const timestampElement = document.createElement('div');
    timestampElement.innerHTML = `<p>${post.timestamp}</p>`;
    timestampElement.setAttribute("id", "timestamp");

    const likesElement = document.createElement('div');
    likesElement.innerHTML = `<p>Likes: ${post.likes}</p>`
   
    cardBodyElement.appendChild(cardTitleElement);
    cardBodyElement.append(bodyContentElement);
    cardBodyElement.append(timestampElement);
    cardBodyElement.append(likesElement);


    postBoxElement.append(cardBodyElement);

    return postBoxElement;
}