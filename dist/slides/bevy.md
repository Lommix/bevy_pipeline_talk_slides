## How does this work in Bevy?

---

## The Render world

![world](img/renderworld.png)

---

## Render Graph

![world](img/graph.png)

---

```[|5-7]
pub trait Node: Downcast + Send + Sync + 'static {

    fn run<'w>(
        &self,
        graph: &mut RenderGraphContext,  // inputs, outputs and more
        render_context: &mut RenderContext<'w>, // gpu connection
        world: &'w World, // render world
    ) -> Result<(), NodeRunError>;

    ...
}
```

<!-- .element class="" style="width:65rem" -->

---

## The Pipeline

-   Define the memory layout on the GPU
-   Define how the data is interpreted

---

![world](img/inject.png)

---

## Render world Schedules

![world](img/stages.png)

---

## Extract

Copy the data we need into the Render World

![world](img/extract.png)

---

## Queue

For each camera view check check if our object is visible, if so, add it to its phase

![world](img/queue.png)

---

## Prepare

Transform the queued data into WGPU buffers

![world](img/prepare.png)

---

## Render Command

-   Activate our pipeline
-   bind our data
-   send the draw call

```rust
pub type DrawSprite = (
    SetItemPipeline,
    SetSpriteViewBindGroup<0>,
    SetSpriteTextureBindGroup<1>,
    DrawSpriteBatch,
);
```

<!-- .element class="fragment" style="width:35rem" -->
