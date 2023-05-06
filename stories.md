---
layout: stories
---

{% comment %} Initialize an empty array for unique universes {% endcomment %}
{% assign unique_universes = "" | split: "," %}

{% comment %} Loop through all stories and add unique universe tags to the array {% endcomment %}
{% for story in site.stories %}
  {% unless unique_universes contains story.universe %}
    {% assign unique_universes = unique_universes | push: story.universe %}
  {% endunless %}
{% endfor %}

{% comment %} Sort the unique_universes array alphabetically {% endcomment %}
{% assign unique_universes = unique_universes | sort %}

{% comment %} Loop through the unique_universes array and create headings for each universe {% endcomment %}
{% for universe in unique_universes %}
  <h2>{{ universe }}</h2>
  <ul>
  {% for story in site.stories %}
    {% if story.universe == universe %}
      <li><a href="{{ story.url | relative_url }}">{{ story.title }}</a></li>
    {% endif %}
  {% endfor %}
  </ul>
{% endfor %}