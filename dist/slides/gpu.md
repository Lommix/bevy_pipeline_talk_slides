## A short intro to GPUs

<br/>

POINTS -> TRIANGLES -> PIXEL -> COLOR

<img class="" src="img/overview.png" alt="">

---

## Vertices, Indices, and Instances

<img class="" src="img/index.png" alt="">

<br/>

-   Vertices are just points in 3D Space <!-- .element class="fragment" -->
-   Indices describe the Order in which the points are connected <!-- .element class="fragment" -->
-   Instances describe how often the same vertex is drawn <!-- .element class="fragment" -->

---

## UV Mapping

<img class="" src="img/uv.png" alt="">

<br/>

-   Mapping a texture to a triangle
-   define a position per vertex
-   the GPU will compute the UV per pixel for you.

---

## The Pipeline

<img class="" src="img/pipeline.png" alt="">
