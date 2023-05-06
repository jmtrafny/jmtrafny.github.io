---
layout: default
---

{% for post in site.posts %}
  <div class="post">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p>{{ post.excerpt }}</p>
    <p><a href="{{ post.url | relative_url }}">Read more...</a></p>
  </div>
  <hr>
{% endfor %}
