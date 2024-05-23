## Intro to the Render world

---

## Render Graph

Node trait

---

## Pipeline

Configure our goal

---

## Bindgroups

The data we want to pass

---

## Bevys Macros

AsBindGroup, ShaderType

---

## Extract

Copy the data we need into the Render World

---

## Queue

For each camera view check check if our object is visible, if so, add it to its phase

---

## Phase Item

the phase items describes a an entity that will be rendered on a specific camera view

---

## Prepare

for each queued item, transform our data into wgpu Buffers

---

## Draw Command

copy our data to the gpu and send our draw command
