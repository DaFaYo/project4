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

      json_response.posts.forEach((post) => {

        postElement = create_post_box(post);
        postsContainer.appendChild(postElement);

      });

      


    }).catch((error) => {
      console.log(`error: ${error}`);
    });

}

function update_paginator(page_name, paginator) {

  const first_page_link = document.getElementById('first-page-link');
  const previous_page_link = document.getElementById('previous-page-link');

  if (paginator.has_previous) {
    first_page_link.style.visibility = 'visible';
    previous_page_link.style.visibility = 'visible';

    first_page_link.onclick = () => load_posts(page_name, 1);


  } else {
    first_page_link.style.visibility = 'hidden';
    previous_page_link.style.visibility = 'hidden';
  }

  const last_page_link = document.getElementById('last-page-link');
  last_page_link.onclick = () => load_posts(page_name, paginator.num_pages);

}


function create_post_box(post) {

  const postBoxElement = document.createElement('div');
  postBoxElement.setAttribute("class", "card");

  const cardBodyElement = document.createElement('div');
  cardBodyElement.setAttribute("class", "card-body");

  const cardTitleElement = document.createElement('h5');
  cardTitleElement.setAttribute("class", "card-title");
  cardTitleElement.innerHTML = post.poster;
  cardTitleElement.addEventListener('click', () => {
    load_profile(post.poster_id);
  });

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
