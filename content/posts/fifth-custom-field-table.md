---
title: The fifth custom field is a table
date: 2026-09-16
summary: Custom fields postpone a data model decision, and vendors sell the ceiling as a feature. Fields that are filled together and empty together are a table waiting to be named.
tags: Data Modelling, CRM, PostgreSQL
draft: false
---

A custom field is the cheapest change a CRM administrator can make, and that is its problem. Someone needs to track a vehicle registration on a contact, so they add a field. Then a make, a model, a colour, an insurance expiry. Five fields later the contact record is quietly carrying a second entity, with its own lifecycle, no identity, and no way to have two of them. The CRM I built at CustomGlide shares one contact and account model across pipelines, campaigns and ticketing, so every field decision is felt three times, and the rule this post describes is the one I use to decide when a field is a field and when it is a table in disguise.

## The ceiling is the trouble

Vendors sell the field limit as a feature, and the limits are generous enough that almost nobody hits them. Zoho CRM's [custom field limits](https://help.zoho.com/portal/en/kb/crm/customize-crm-account/customizing-fields/articles/use-custom-fields) run from 10 per module on Standard to 155 on Professional and 300 on Enterprise. HubSpot allows [1,000 custom properties per object](https://developers.hubspot.com/docs/api-reference/crm-limits-tracking-v3/limits/get-crm-v3-limits-custom-properties) on paid tiers, with a much smaller allowance on the free one. The generosity is the point of the sales pitch and the source of the rot: a schema does not fail when it fills, it fails long before, when the fields stop meaning what their names say and nobody can tell which of the three hundred are still used.

<figure class="chart">
<svg viewBox="0 0 640 250" role="img" aria-labelledby="f1-t f1-d">
<title id="f1-t">Custom field ceilings by product and edition</title>
<desc id="f1-d">Horizontal bars on a logarithmic scale: Zoho Standard 10 fields per module, Zoho Professional 155, Zoho Enterprise 300, HubSpot 1,000 custom properties per object. The HubSpot bar is highlighted as the highest ceiling.</desc>
<text x="0" y="18" class="viz-title">Nobody hits the ceiling; the schema rots first</text>
<text x="0" y="36" class="viz-sub">Custom fields allowed per module or object, log scale</text>
<line x1="176" y1="52" x2="176" y2="188" class="viz-axis"/>
<text x="166" y="73" text-anchor="end" class="viz-label">Zoho Standard</text>
<path d="M176 58 H253 a4 4 0 0 1 4 4 V74 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="273" y="73" class="viz-value">10</text>
<text x="166" y="107" text-anchor="end" class="viz-label">Zoho Professional</text>
<path d="M176 92 H456 a4 4 0 0 1 4 4 V108 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="476" y="107" class="viz-value">155</text>
<text x="166" y="141" text-anchor="end" class="viz-label">Zoho Enterprise</text>
<path d="M176 126 H504 a4 4 0 0 1 4 4 V142 a4 4 0 0 1 -4 4 H176 Z" class="viz-fgray"/>
<text x="524" y="141" class="viz-value">300</text>
<text x="166" y="175" text-anchor="end" class="viz-label">HubSpot, per object</text>
<path d="M176 160 H536 a4 4 0 0 1 4 4 V176 a4 4 0 0 1 -4 4 H176 Z" class="viz-f1"/>
<text x="556" y="175" class="viz-value">1,000</text>
<text x="0" y="222" class="viz-label-muted">Log scale; the bars are drawn so that each factor of ten adds the same length.</text>
</svg>
<figcaption>Source: <a href="https://help.zoho.com/portal/en/kb/crm/customize-crm-account/customizing-fields/articles/use-custom-fields">Zoho CRM's custom field documentation</a> and <a href="https://developers.hubspot.com/docs/api-reference/crm-limits-tracking-v3/limits/get-crm-v3-limits-custom-properties">HubSpot's limits reference</a>, September 2026.</figcaption>
</figure>

## The co-fill test

The rule is a measurement, and it runs quarterly on the CRM as a field census. For every pair of custom fields on a record type, compute how often they are populated together and empty together across all records. Two fields that are always filled together and always blank together are not two attributes of the record. They are two attributes of something else that the record sometimes has. When a group of such fields grows to five, that is the point to stop, name the something else, and give it a table.

The count of five is a threshold, not a law, and its logic is that below it the cost of a separate table exceeds the cost of a few nullable columns, and above it the reverse. Two co-filled fields are a pair of nullable columns and nobody minds. Five is a registration, a make, a model, a colour and an expiry, and by then someone has asked for a second vehicle, which the flat design cannot represent, and someone else has asked which contacts have a vehicle, which the flat design answers only by checking whether one of the five happens to be non-null.

<figure class="chart">
<svg viewBox="0 0 640 300" role="img" aria-labelledby="f2-t f2-d">
<title id="f2-t">A co-fill matrix over eight custom fields</title>
<desc id="f2-d">An eight by eight grid of fields where each cell's shade shows how often the two fields are populated together. Five fields, registration, make, model, colour and expiry, form a dense block of high co-fill in one corner. The other three fields, a referral source, a birthday and a newsletter flag, show low co-fill with everything.</desc>
<text x="0" y="18" class="viz-title">Five fields that move together</text>
<text x="0" y="36" class="viz-sub">Share of records where both fields are populated; darker is higher</text>
<text x="140" y="70" text-anchor="end" class="viz-label-muted">registration</text>
<text x="140" y="94" text-anchor="end" class="viz-label-muted">make</text>
<text x="140" y="118" text-anchor="end" class="viz-label-muted">model</text>
<text x="140" y="142" text-anchor="end" class="viz-label-muted">colour</text>
<text x="140" y="166" text-anchor="end" class="viz-label-muted">expiry</text>
<text x="140" y="190" text-anchor="end" class="viz-label-muted">referral source</text>
<text x="140" y="214" text-anchor="end" class="viz-label-muted">birthday</text>
<text x="140" y="238" text-anchor="end" class="viz-label-muted">newsletter</text>
<rect x="150" y="56" width="22" height="22" class="viz-q5"/><rect x="174" y="56" width="22" height="22" class="viz-q5"/><rect x="198" y="56" width="22" height="22" class="viz-q5"/><rect x="222" y="56" width="22" height="22" class="viz-q4"/><rect x="246" y="56" width="22" height="22" class="viz-q4"/><rect x="270" y="56" width="22" height="22" class="viz-q1"/><rect x="294" y="56" width="22" height="22" class="viz-q1"/><rect x="318" y="56" width="22" height="22" class="viz-q2"/>
<rect x="150" y="80" width="22" height="22" class="viz-q5"/><rect x="174" y="80" width="22" height="22" class="viz-q5"/><rect x="198" y="80" width="22" height="22" class="viz-q5"/><rect x="222" y="80" width="22" height="22" class="viz-q4"/><rect x="246" y="80" width="22" height="22" class="viz-q4"/><rect x="270" y="80" width="22" height="22" class="viz-q1"/><rect x="294" y="80" width="22" height="22" class="viz-q1"/><rect x="318" y="80" width="22" height="22" class="viz-q2"/>
<rect x="150" y="104" width="22" height="22" class="viz-q5"/><rect x="174" y="104" width="22" height="22" class="viz-q5"/><rect x="198" y="104" width="22" height="22" class="viz-q5"/><rect x="222" y="104" width="22" height="22" class="viz-q4"/><rect x="246" y="104" width="22" height="22" class="viz-q4"/><rect x="270" y="104" width="22" height="22" class="viz-q1"/><rect x="294" y="104" width="22" height="22" class="viz-q1"/><rect x="318" y="104" width="22" height="22" class="viz-q2"/>
<rect x="150" y="128" width="22" height="22" class="viz-q4"/><rect x="174" y="128" width="22" height="22" class="viz-q4"/><rect x="198" y="128" width="22" height="22" class="viz-q4"/><rect x="222" y="128" width="22" height="22" class="viz-q5"/><rect x="246" y="128" width="22" height="22" class="viz-q4"/><rect x="270" y="128" width="22" height="22" class="viz-q1"/><rect x="294" y="128" width="22" height="22" class="viz-q1"/><rect x="318" y="128" width="22" height="22" class="viz-q2"/>
<rect x="150" y="152" width="22" height="22" class="viz-q4"/><rect x="174" y="152" width="22" height="22" class="viz-q4"/><rect x="198" y="152" width="22" height="22" class="viz-q4"/><rect x="222" y="152" width="22" height="22" class="viz-q4"/><rect x="246" y="152" width="22" height="22" class="viz-q5"/><rect x="270" y="152" width="22" height="22" class="viz-q1"/><rect x="294" y="152" width="22" height="22" class="viz-q1"/><rect x="318" y="152" width="22" height="22" class="viz-q2"/>
<rect x="150" y="176" width="22" height="22" class="viz-q1"/><rect x="174" y="176" width="22" height="22" class="viz-q1"/><rect x="198" y="176" width="22" height="22" class="viz-q1"/><rect x="222" y="176" width="22" height="22" class="viz-q1"/><rect x="246" y="176" width="22" height="22" class="viz-q1"/><rect x="270" y="176" width="22" height="22" class="viz-q5"/><rect x="294" y="176" width="22" height="22" class="viz-q2"/><rect x="318" y="176" width="22" height="22" class="viz-q2"/>
<rect x="150" y="200" width="22" height="22" class="viz-q1"/><rect x="174" y="200" width="22" height="22" class="viz-q1"/><rect x="198" y="200" width="22" height="22" class="viz-q1"/><rect x="222" y="200" width="22" height="22" class="viz-q1"/><rect x="246" y="200" width="22" height="22" class="viz-q1"/><rect x="270" y="200" width="22" height="22" class="viz-q2"/><rect x="294" y="200" width="22" height="22" class="viz-q5"/><rect x="318" y="200" width="22" height="22" class="viz-q2"/>
<rect x="150" y="224" width="22" height="22" class="viz-q2"/><rect x="174" y="224" width="22" height="22" class="viz-q2"/><rect x="198" y="224" width="22" height="22" class="viz-q2"/><rect x="222" y="224" width="22" height="22" class="viz-q2"/><rect x="246" y="224" width="22" height="22" class="viz-q2"/><rect x="270" y="224" width="22" height="22" class="viz-q2"/><rect x="294" y="224" width="22" height="22" class="viz-q2"/><rect x="318" y="224" width="22" height="22" class="viz-q5"/>
<rect x="148" y="54" width="122" height="122" rx="4" fill="none" class="viz-s1"/>
<text x="380" y="110" class="viz-label">the block the test finds:</text>
<text x="380" y="130" class="viz-label-muted">five fields filled together</text>
<text x="380" y="150" class="viz-label-muted">and blank together</text>
<text x="380" y="180" class="viz-label-muted">the other three are</text>
<text x="380" y="200" class="viz-label-muted">attributes of the contact</text>
<text x="380" y="280" class="viz-tick">shading is drawn, not measured</text>
</svg>
<figcaption>Illustrative: the shape the census produces when five fields describe a separate entity; the values are drawn, not measured.</figcaption>
</figure>

The census is a single query per pair, or one pass over the records that counts, for each pair, the four cases. The matrix that comes out has dense blocks wherever a hidden entity lives, and the blocks are visible at a glance, which is why I keep it as a picture rather than a threshold on a number.

## Running the census

The mechanics are small. For a record type with n custom fields there are n times n minus one, over two, pairs, which for fifty fields is 1,225 and for three hundred is under forty-five thousand, both trivial for one pass over the table. For each record and each pair, note whether both fields are populated, neither is, or exactly one is. The co-fill score for a pair is the share of records in the first two cases, both or neither, out of all records where at least one of the two fields is populated anywhere in the data, which stops a pair of fields that are simply both rare from scoring high because they are both blank on everyone.

Two refinements matter in practice. The first is to exclude fields that are populated on nearly every record, because a field like owner co-fills with everything and tells you nothing. The second is to treat the matrix as a graph and look for cliques rather than pairs: five fields that each co-fill with the other four are the signal, and a field that co-fills with one other but not the rest is just a correlated attribute. The output is a short list of candidate groups with their member fields, ordered by size and score, and it is that list, not the matrix, that goes to the people who own the model.

## Two objections

The first objection is that the CRM already has custom objects, so why not use those. The answer is that a custom object with custom fields is the same postponement one level up: it has an identity and a lifecycle, which is genuinely better, and it has the same ceiling and the same rot inside it, because nothing stops the vehicle object from growing its own block of fields that are really a policy. The census runs on custom objects too, and the rule is the same.

The second is that a JSON column would let each record carry whatever it needs without any of this. It would, and a JSON column is the flat design with the column names removed: no types, no constraints, no way to say that a contact has two vehicles except by putting an array inside, and no way to query expiries next month without a path expression that every report has to know. It is the right tool for data that is genuinely different on every record and the wrong one for five fields that are the same on every record that has them.

## What the table gives back

Promoting the block to a table is the change people postpone because it sounds like a migration, and it is smaller than it sounds. The five fields become columns on a new table with its own id and a foreign key to the contact. A view that joins the two reproduces the flat record for anything that depended on it. The existing values are copied across in one statement. What the table gives back is everything the flat design could not do: a contact with two vehicles, a vehicle that moves between contacts, a query for expiries next month that does not have to know which of five columns to check, and a lifecycle, so that a vehicle can be added, sold and removed without the contact's history changing.

<figure class="chart">
<svg viewBox="0 0 640 262" role="img" aria-labelledby="f3-t f3-d">
<title id="f3-t">Before and after: five custom fields become a vehicle table</title>
<desc id="f3-d">Left: a contact record with its own fields and five vehicle fields tacked on, registration, make, model, colour, expiry. Right: the contact record with only its own fields, and a separate vehicle table with those five columns, an id, and a foreign key to the contact. A note says a contact can now have two vehicles and a vehicle can move.</desc>
<text x="0" y="18" class="viz-title">Same data, with an identity of its own</text>
<rect x="8" y="40" width="290" height="190" rx="8" class="viz-box"/>
<text x="24" y="66" class="viz-label">contact, before</text>
<text x="24" y="92" class="viz-label-muted">name, email, phone, owner</text>
<text x="24" y="116" class="viz-label-muted">vehicle_registration</text>
<text x="24" y="136" class="viz-label-muted">vehicle_make</text>
<text x="24" y="156" class="viz-label-muted">vehicle_model</text>
<text x="24" y="176" class="viz-label-muted">vehicle_colour</text>
<text x="24" y="196" class="viz-label-muted">vehicle_insurance_expiry</text>
<text x="24" y="220" class="viz-tick">one vehicle, forever, or none</text>
<rect x="332" y="40" width="300" height="80" rx="8" class="viz-box"/>
<text x="348" y="66" class="viz-label">contact, after</text>
<text x="348" y="92" class="viz-label-muted">name, email, phone, owner</text>
<rect x="332" y="132" width="300" height="98" rx="8" class="viz-box-accent"/>
<text x="348" y="158" class="viz-label">vehicle</text>
<text x="348" y="182" class="viz-label-muted">id, contact_id, registration, make,</text>
<text x="348" y="202" class="viz-label-muted">model, colour, insurance_expiry</text>
<text x="348" y="222" class="viz-tick">many per contact; sold, moved, removed</text>
<text x="320" y="254" text-anchor="middle" class="viz-label-muted">A view joining the two keeps every old report working while the new ones become possible.</text>
</svg>
<figcaption>Illustrative: the promotion the co-fill test recommends; the vehicle is a stand-in for whatever entity the block turns out to be.</figcaption>
</figure>

## Why vendors cannot do this for you

A general-purpose CRM cannot promote fields to tables on your behalf, because it does not know what the entity is, and its custom-object features, which exist, are the same postponement one level up: an object whose attributes are custom fields, with the same ceiling and the same rot. What it can do is offer enough fields that the decision never has to be made, and that is the feature. The result is the schema I meet on most migrations: hundreds of fields, of which a third are blank on every record, a third are two or three entities interleaved, and a third are the contact.

In the CRM I built, the census runs on a schedule and its output goes to the people who own the data model, with the dense blocks named. The decision to promote is still a human one, because the human knows that the block is a vehicle or a policy or a site visit. What the census removes is the discovery cost, which is the part that used to take a consultant a week and a spreadsheet.

## The rule

Count fields by whether they move together, not by how many there are. Two co-filled fields are columns. Five are a table wearing columns' clothes, and the fifth one is the moment to name it. The ceiling the vendor gave you is not a budget. It is the amount of postponement they are willing to sell.
