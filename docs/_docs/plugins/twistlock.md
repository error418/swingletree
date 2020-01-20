---
title: Twistlock Plugin
permalink: /docs/plugins/twistlock/
redirect_from: /docs/index.html
---

[Twistlock][twistlock] is a security scanner for containers. It can scan docker containers for vulnerabilities and compliance violations.

## Features

The Swingletree Twistlock Plugin offers following functionalities:

* Attaches Twistlock findings to GitHub Pull Requests by evaluating the Twistlock scan report.

Processed data is persisted to ElasticSearch (if enabled) and can be processed to reports using Kibana or Grafana.

## Sending a scan report to Swingletree

<div class="well well-sm">
  Yoke CLI can be used to send a Twistlock scan report. See the docs to learn how to send reports with ease.
</div>

A Swingletree webhook is published when the Twistlock Plugin is enabled.
It accepts a Twistlock scan report (generated by the twistlock cli) in JSON format as a payload and needs some additional query parameters to link the report to a GitHub repository:

```
POST /report/twistlock?org=[GitHub Organization]&repo=[Repository name]&sha=[Commit SHA]&branch=[branch]
```

It is recommended to protect your webhook endpoint. If you enabled webhook protection you will need to provide the authentication credentials via Basic Authentication.

Swingletree will process the report and send a Check Run Status with the context `security/twistlock` to the given GitHub coordinates.

## Repository-specific Configuration

Repository-specific behaviour can be configured by placing a `.swingletree.yaml` in the repository root directory. Swingletree reads from the master branch file only.

Swingletree fails on any findings, if no `.swingletree.yaml` is available in the repository.

```yaml
plugin:
  twistlock:
    # vulnerabilities equal or above this cvss score require developer action
    thresholdCvss: 8
    # compliance issues equal or above this severity require developer action
    thresholdCompliance: high

    # define false-positives to exclude them
    whitelist:
      CVE-1230: not applicable
      CVE-3332: also not applicable
    # CVE-Key: exclusion note
    # Compliance-id: exclusion note
```

| Property | Description | Default |
| --- | --- | --- |
| `thresholdCvss` | Vulnerabilities higher or equal to this CVSS score are targeted | `0` |
| `thresholdCompliance` | Compliance issues higher or equal to this Twistlock severity are targeted | `low` |


[twistlock]: https://www.twistlock.com/