document.addEventListener('DOMContentLoaded', () => {

  const followLink = document.querySelector('#following-link');
  if (followLink) {
    followLink.addEventListener('click', () => load_posts('following'));
  }

  document.querySelector('#post-form').onsubmit = send_post;

  load_posts('all posts');
});

function initialize_page(page_name) {

  document.querySelector('#all-posts-view').style.display = 'block';
  document.querySelector('#error-message').style.display = 'none';
  document.querySelector('#error-message').innerHTML = '';

  document.querySelector('#post-body').value = '';
  document.querySelector('#posts-view').innerHTML = '';
  document.querySelector('#profile-view').innerHTML = '';
  document.querySelector('#page-name').innerHTML = `<h3>${page_name.charAt(0).toUpperCase() + page_name.slice(1)}</h3>`;
  document.querySelector('#pagination-view').style.display = 'block';

} 

// Creating a text-area with auto-resize. From Stackoverflow:
// https://stackoverflow.com/questions/454202/creating-a-textarea-with-auto-resize
function setAutoResizeToTextAreaElement(tx) {
    tx.addEventListener("input", OnInput, false);
} 

function OnInput() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + "px";
}


function send_post(e) {

  e.preventDefault();

  const _body = document.querySelector('#post-body').value;
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
      if (result.hasOwnProperty('error')) {
        errorMessageElement.innerHTML = result.error;
        errorMessageElement.style.display = 'block';
        setTimeout(() => {
          errorMessageElement.innerHTML = '';
          errorMessageElement.style.display = 'none';
        }, 5000);
      } else {
        errorMessageElement.innerHTML = '';
        errorMessageElement.style.display = 'none';
        load_posts('all posts');
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

function load_posts(page_name, page_number = 1) {

  initialize_page(page_name);
  get_posts(page_name, page_number);

}

function load_profile(user) {

  document.querySelector('#all-posts-view').style.display = 'none';
  document.querySelector('#pagination-view').style.display = 'none';
  document.querySelector('#posts-view').innerHTML = '';
  document.querySelector('#profile-view').innerHTML = '';

  get_profile(user);
}


function get_posts(page_name, page_number) {

  let endpoint = "/posts";
  if (page_name == "following") {
    endpoint = "/following";
  }

  fetch(`${endpoint}?page=${page_number}`)
    .then(response => response.json())
    .then(json_response => {

      this.update_paginator(page_name, json_response.paginator);

      const postsContainer = document.querySelector('#posts-view');
      postsContainer.value = '';

      const user_id = (json_response.logged_in_user) ? json_response.logged_in_user.user_id : -1;
     
      json_response.posts.forEach((post) => {

        postElement = create_post_box(post, user_id);
        postsContainer.appendChild(postElement);

      });

      


    }).catch((error) => {
      console.log(`error: ${error}`);
    });

}

function update_paginator(page_name, paginator) {

  const first_page_link = document.getElementById('first-page-link');
  const previous_page_link = document.getElementById('previous-page-link');

  const current_page_span = document.getElementById('current-page-span');
  current_page_span.innerHTML = `Page ${paginator.page_number} of ${paginator.num_pages}.`;

  const next_page_link = document.getElementById('next-page-link');
  const last_page_link = document.getElementById('last-page-link');

  if (paginator.has_previous) {
    first_page_link.style.visibility = 'visible';
    previous_page_link.style.visibility = 'visible';

    first_page_link.onclick = () => load_posts(page_name, 1);
    previous_page_link.onclick = () => load_posts(page_name, paginator.page_number - 1);

  } else {
    first_page_link.style.visibility = 'hidden';
    previous_page_link.style.visibility = 'hidden';
  }

  if (paginator.has_next) {
    next_page_link.style.visibility = 'visible';
    last_page_link.style.visibility = 'visible';

    next_page_link.onclick = () => load_posts(page_name, paginator.page_number + 1);
    last_page_link.onclick = () => load_posts(page_name, paginator.num_pages);

  } else {
    next_page_link.style.visibility = 'hidden';
    last_page_link.style.visibility = 'hidden';
  }



}


function create_post_box(post, user_id) {

  const postBoxElement = document.createElement('div');
  postBoxElement.setAttribute("class", "card");

  const cardBodyElement = document.createElement('div');
  cardBodyElement.setAttribute("class", "card-body");

  const cardTitleElement = document.createElement('h5');
  cardTitleElement.setAttribute("class", "card-title");
  cardTitleElement.innerHTML = `<p>${post.poster}</p>`;
  cardTitleElement.addEventListener('click', () => {
    load_profile(post.poster_id);
  });

  cardBodyElement.appendChild(cardTitleElement);

  const bodyContentElement = document.createElement('div');
  bodyContentElement.innerHTML = post.body;

  if (user_id === post.poster_id) {
    const editLinkElement = document.createElement('a');
    editLinkElement.setAttribute("class", "text-primary");
    editLinkElement.innerHTML = 'Edit';
    editLinkElement.addEventListener('click', (event) => {
      editPost(event, post, user_id);
    });
    cardBodyElement.append(editLinkElement);
  }

  cardBodyElement.append(bodyContentElement);

  const timestampElement = document.createElement('div');
  timestampElement.innerHTML = `<br>${post.timestamp}`;
  timestampElement.setAttribute("id", "timestamp");
  cardBodyElement.append(timestampElement);

  const likesElement = document.createElement('div');
  likesElement.innerHTML = `Likes: ${post.likes}`;
  cardBodyElement.append(likesElement);
  
  postBoxElement.append(cardBodyElement);

  return postBoxElement;
}


function editPost(event, post, user_id) {

  const divElement = document.createElement('div');
  const textAreaElement = document.createElement('textarea');
  textAreaElement.innerHTML = event.target.nextSibling.innerHTML;
  setAutoResizeToTextAreaElement(textAreaElement);
  divElement.appendChild(textAreaElement);

  const buttonElement = document.createElement('button');
  buttonElement.addEventListener('click', (event) => {
    updatePost(event, post, user_id);
  });


  buttonElement.innerHTML = 'Save';
  divElement.appendChild(buttonElement);
  
  event.target.nextSibling.remove();
  event.target.replaceWith(divElement);

}


function updatePost(event, post, user_id) {

  post.body = event.target.previousElementSibling.value;

  const csrftoken = getCookie('csrftoken');

  fetch(`/posts/${post.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    mode: 'same-origin', // Do not send CSRF token to another domain.
    body: JSON.stringify({
        post_body: post.body
    })
  }).then(() => {
    updatePostBox(event, post, user_id);
  }).catch((error) => {
  console.log(`error: ${error}`);
});

}

function updatePostBox(event, post, user_id) {

  let post_box = event.target.parentNode.parentNode.parentNode;
  post_box.replaceWith(create_post_box(post, user_id));

}



function get_profile(profile_id) {

  fetch(`/profiles/${profile_id}`)
    .then(response => response.json())
    .then(user => {

      const profileContainer = document.querySelector('#profile-view');
      profileContainer.value = '';

      profileElement = create_profile_box(user);
      profileContainer.appendChild(profileElement);


    }).catch((error) => {
      console.log(`error: ${error}`);
    });

}

function create_profile_box(user) {

  const element = document.createElement('div');

  const textElement = document.createElement('div');
  const followButtonElement = document.createElement('button');

  textElement.innerHTML = `
  
  <h2>profile</h2>
  <b>username:</b> ${user.username}<br>
  <b>id:</b> ${user.id}<br>
  <b>email:</b> ${user.email}<br>
  <b>followers:</b> ${user.number_of_followers}<br>
  <b>number of people ${user.username} follows:</b> ${user.number_of_following}
  `;

  element.append(textElement);

  if (user.hasOwnProperty('following')) {
    followButtonElement.setAttribute("class", "btn btn-sm btn-outline-primary");
    followButtonElement.innerHTML = (user.following) ? "Unfollow" : "Follow";
    followButtonElement.addEventListener('click', () => {
    follow_unfollow(user);
    });
    element.append(followButtonElement);
  }
  
  return element;
}



function follow_unfollow(user) {

  const csrftoken = getCookie('csrftoken');

  fetch(`/profiles/${user.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken
    },
    mode: 'same-origin', // Do not send CSRF token to another domain.
    body: JSON.stringify({
        following: !user.following
    })
  }).then(() => {
    load_profile(user.id);
  }).catch((error) => {
  console.log(`error: ${error}`);
});

}
