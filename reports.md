---
layout: session-reports
---

{% comment %} Initialize an empty array for unique groups {% endcomment %}
{% assign unique_groups = "" | split: "," %}

{% comment %} Loop through all reports and add unique group tags to the array {% endcomment %}
{% for report in site.reports %}
  {% unless unique_groups contains report.group %}
    {% assign unique_groups = unique_groups | push: report.group %}
  {% endunless %}
{% endfor %}

{% comment %} Sort the unique_groups array alphabetically {% endcomment %}
{% assign unique_groups = unique_groups | sort %}

{% comment %} Loop through the unique_groups array and create headings for each group {% endcomment %}
{% for group in unique_groups %}
  <h2>{{ group }}</h2>
  <ul>
    {% assign group_reports = site.reports | where: "group", group | sort: "sequence" %}
    {% for report in group_reports %}
      <li><a href="{{ report.url | relative_url }}">{{ report.title }}</a></li>
    {% endfor %}
  </ul>
{% endfor %}

