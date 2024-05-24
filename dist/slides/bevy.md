## How does this work in Bevy?

---

## The Render world

![world](img/renderworld.png)

---

## Render Graph

![world](img/graph.png)

---

## Pipeline

Configure our goal

---

## Render Stages

![world](img/stages.png)

---

## Bindgroups

The data we want to pass

---

## Extract

Copy the data we need into the Render World

---

## Queue

For each camera view check check if our object is visible, if so, add it to its phase

---

## Prepare

for each queued item, transform our data into wgpu Buffers

---

## Draw Command

copy our data to the gpu and send our draw command
