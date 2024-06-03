## Example

[https://github.com/lommix/bevy_render_example](https://github.com/lommix/bevy_render_example)

<div class="row">
    <video src="assets/example.webm" autoplay=true loop></video>
</div>

---

# Creating our Component

```rust []
#[derive(AsBindGroup, Component, Clone)]
pub struct CustomSprite {
    #[texture(0)]
    #[sampler(1)]
    pub texture: Handle<Image>,
}
```

<!-- .element class="fragment" -->

```rust [|3|4|5|8-9]
#[derive(Resource)]
pub struct CustomPipeline {
    view_layout: BindGroupLayout,
    uniform_layout: BindGroupLayout,
    shader: Handle<Shader>,
}

#[derive(PartialEq, Eq, Clone, Hash)]
pub struct CustomPipelineKey;

```

<!-- .element class="fragment" -->

---

## The Mesh

```rust
#[derive(Resource)]
pub struct FixedQuadMesh {
    vertex_buffer: BufferVec<Vec3>,
    index_buffer: BufferVec<u32>,
}
```

<!-- .element class="fragment" -->

```rust [|3-4|6-7|9-15|17-22]
impl FromWorld for FixedQuadMesh {
    fn from_world(world: &mut World) -> Self {
        let render_device = world.resource::<RenderDevice>();
        let render_queue = world.resource::<RenderQueue>();

        let mut vertex_buffer = BufferVec::<Vec3>::new(BufferUsages::VERTEX);
        let mut index_buffer = BufferVec::<u32>::new(BufferUsages::INDEX);

        vertex_buffer.extend([
            Vec3::new(0., 0., 0.),
            Vec3::new(1., 0., 0.),
            Vec3::new(1., 1., 0.),
            Vec3::new(0., 1., 0.),
        ]);
        vertex_buffer.write_buffer(render_device, render_queue);

        index_buffer.extend([
            0, 1, 2, // first triangle
            0, 2, 3, // second triangle
        ]);
        index_buffer.write_buffer(render_device, render_queue);

        Self {
            vertex_buffer,
            index_buffer,
        }
    }
}
```

<!-- .element class="fragment" -->

---

# Configuring the Pipeline

```rust [|3-4|6-15|17]
impl FromWorld for CustomPipeline {
    fn from_world(world: &mut World) -> Self {
        let server = world.resource::<AssetServer>();
        let render_device = world.resource::<RenderDevice>();

        let view_layout = render_device.create_bind_group_layout(
            "mesh2d_view_layout",
            &BindGroupLayoutEntries::sequential(
                ShaderStages::VERTEX_FRAGMENT,
                (
                    uniform_buffer::<ViewUniform>(true),
                    uniform_buffer::<GlobalsUniform>(false),
                ),
            ),
        );

        let uniform_layout = CustomSprite::bind_group_layout(render_device);

        Self {
            view_layout,
            uniform_layout,
            shader: server.load("shader.wgsl"),
        }
    }
}
```

<!-- .element class="fragment" -->

---

```rust [|1-2|10-15|16-20|22-32|34-59|60-68|70-78|81-85]
#[derive(PartialEq, Eq, Clone, Hash)]
pub struct CustomPipelineKey;

impl SpecializedRenderPipeline for CustomPipeline {
    type Key = CustomPipelineKey;

    #[rustfmt::skip]
    fn specialize(&self, _key: Self::Key) -> RenderPipelineDescriptor {

        RenderPipelineDescriptor {
            label: Some("my pipeline".into()),
            layout: vec![
                self.view_layout.clone(),
                self.uniform_layout.clone()
            ],
            vertex: VertexState {
                shader: self.shader.clone(),
                shader_defs: vec![],
                entry_point: "vertex".into(),
                buffers: vec![
                    // vertex buffer
                    VertexBufferLayout {
                        array_stride: 12,
                        step_mode: VertexStepMode::Vertex,
                        attributes: vec![
                            VertexAttribute{
                                format: VertexFormat::Float32x3,
                                offset: 0,
                                shader_location: 0
                            }
                        ]
                    },
                    // instance buffer
                    VertexBufferLayout {
                        array_stride: 48,
                        step_mode: VertexStepMode::Instance,
                        attributes: vec![
                            // translation
                            VertexAttribute {
                                format: VertexFormat::Float32x4,
                                offset: 0,
                                shader_location: 1,
                            },
                            // rotation
                            VertexAttribute {
                                format: VertexFormat::Float32x4,
                                offset: 16,
                                shader_location: 2,
                            },
                            // scale
                            VertexAttribute {
                                format: VertexFormat::Float32x4,
                                offset: 32,
                                shader_location: 3,
                            },
                        ],
                    }
                ],
            },
            fragment: Some(FragmentState {
                shader: self.shader.clone(),
                shader_defs: vec![],
                entry_point: "fragment".into(),
                targets: vec![Some(ColorTargetState {
                    format: TextureFormat::Rgba8UnormSrgb,
                    blend: Some(BlendState::ALPHA_BLENDING),
                    write_mask: ColorWrites::ALL,
                })],
            }),
            primitive: PrimitiveState {
                front_face: FrontFace::Ccw,
                cull_mode: None,
                unclipped_depth: false,
                polygon_mode: PolygonMode::Fill,
                conservative: false,
                topology: PrimitiveTopology::TriangleList,
                strip_index_format: None,
            },
            push_constant_ranges: vec![],
            depth_stencil: None,
            multisample: MultisampleState{
                count: 4,
                mask: !0,
                alpha_to_coverage_enabled: false,
            },
        }
    }
}
```

---

Our Pipeline is defined, let's run it!

![](img/stages.png)

<!-- .element class="fragment" -->

---

# Extract

```rust [|1-8|12|15-17|19-25]
#[derive(Component)]
struct ExtractedSpriteInstance {
    instance_data: SpriteTransformMatrix,
    z_order: f32,
}
#[derive(Clone, Copy, Pod, Zeroable)]
#[repr(C)]
pub struct SpriteTransformMatrix([Vec4; 3]);

fn extract(
    mut cmd: Commands,
    sprites: Extract<Query<(Entity, &GlobalTransform, &ViewVisibility, &CustomSprite)>>,
) {
    for (entity, transform, visibilty, sprite) in sprites.iter() {
        if !visibilty.get() {
            continue;
        }

        cmd.get_or_spawn(entity).insert((
            ExtractedSpriteInstance {
                instance_data: SpriteTransformMatrix::from(transform),
                z_order: transform.translation().z,
            },
            sprite.clone(),
        ));
    }
}
```

<!-- .element class="fragment" -->

---

# The queue

```rust [|2-5|6|7|9|12|14-15|17|19-20|24-31]
fn queue(
    transparent_2d_draw_functions: Res<DrawFunctions<Transparent2d>>,
    my_pipeline: Res<CustomPipeline>,
    pipeline_cache: Res<PipelineCache>,
    mut pipelines: ResMut<SpecializedRenderPipelines<CustomPipeline>>,
    mut views: Query<(&VisibleEntities, &mut RenderPhase<Transparent2d>)>,
    extracted_sprites: Query<(Entity, &ExtractedSpriteInstance)>,
) {
    let my_draw_function = transparent_2d_draw_functions.read().id::<MyDrawCommand>();

    // iterate over each camera
    for (visible_entities, mut render_phase) in views.iter_mut() {
        // load the pipline from the loaded pipeline cache
        let key = CustomPipelineKey;
        let pipeline = pipelines.specialize(&pipeline_cache, &my_pipeline, key);

        for (entity, sprite) in extracted_sprites.iter() {
            //check if the current camera can see our entity
            if !visible_entities.entities.contains(&entity) {
                continue;
            }

            // add a `PhaseItem` for our entity to the cameras render phase
            render_phase.add(Transparent2d {
                sort_key: FloatOrd(sprite.z_order),
                entity,
                pipeline,
                draw_function: my_draw_function,
                batch_range: 0..1,
                dynamic_offset: None,
            })
        }
    }
}
```

<!-- .element class="fragment" -->

---

# Prepare

Preparing the data for the GPU

```rust [2-6|7|10-14|16-23|25-29]
fn prepare(
    mut cmd: Commands,
    render_device: Res<RenderDevice>,
    images: Res<RenderAssets<Image>>,
    fallback_image: Res<FallbackImage>,
    pipeline: Res<CustomPipeline>,
    extracted_sprites: Query<(Entity, &ExtractedSpriteInstance, &CustomSprite)>,
) {
    for (entity, sprite_instance, custom_sprite) in extracted_sprites.iter() {
        let instance_buffer = render_device.create_buffer_with_data(&BufferInitDescriptor {
            label: Some("transform buffer"),
            contents: bytemuck::cast_slice(&[sprite_instance.instance_data]),
            usage: BufferUsages::VERTEX | BufferUsages::COPY_DST,
        });

        let uniform_buffer = custom_sprite
            .as_bind_group(
                &pipeline.uniform_layout,
                &render_device,
                &images,
                &fallback_image,
            )
            .unwrap();

        cmd.entity(entity).insert(PreparedSprites {
            uniform_buffer: uniform_buffer.bind_group,
            instance_buffer,
            count: 1,
        });
    }
}
```

<!-- .element class="fragment" -->

---

# Draw

Sending Commands step by step

```rust [|3|5|7|9]
type MyDrawCommand = (
    // ready our pipline to start sending commands
    SetItemPipeline,
    // bind the camera view uniform
    SetMesh2dViewBindGroup<0>,
    // bind our custom uniform
    SetBindGroup<1>,
    // finally send the draw command
    DrawSprite,
);
```

---

# Binding our uniform Data

```rust [|2|3-5|15-17|19]
pub struct SetBindGroup<const I: usize>;
impl<P: PhaseItem, const I: usize> RenderCommand<P> for SetBindGroup<I> {
    type Param = ();
    type ViewQuery = ();
    type ItemQuery = Read<PreparedSprites>;

    #[inline]
    fn render<'w>(
        _item: &P,
        _view: ROQueryItem<'w, Self::ViewQuery>,
        prepared_data: Option<ROQueryItem<'w, Self::ItemQuery>>,
        _param: SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        let Some(prepared_sprite) = prepared_data else {
            return RenderCommandResult::Failure;
        };

        pass.set_bind_group(I, &prepared_sprite.uniform_buffer, &[]);
        RenderCommandResult::Success
    }
}
```

---

# The final draw call

passing our vertex data

```rust [3-5|15-17|19|21-23|25-27|29-31|32]
pub struct DrawSprite;
impl<P: PhaseItem> RenderCommand<P> for DrawSprite {
    type Param = SRes<FixedQuadMesh>;
    type ViewQuery = ();
    type ItemQuery = Read<PreparedSprites>;

    #[inline]
    fn render<'w>(
        _item: &P,
        _view: ROQueryItem<'w, Self::ViewQuery>,
        prepared_data: Option<ROQueryItem<'w, Self::ItemQuery>>,
        param: SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        let Some(prepared_sprite) = prepared_data else {
            return RenderCommandResult::Failure;
        };

        let mesh_data = param.into_inner();

        let Some(index_buffer) = mesh_data.index_buffer.buffer() else {
            return RenderCommandResult::Failure;
        };

        let Some(vertex_buffer) = mesh_data.vertex_buffer.buffer() else {
            return RenderCommandResult::Failure;
        };

        pass.set_vertex_buffer(0, vertex_buffer.slice(..));
        pass.set_vertex_buffer(1, prepared_sprite.instance_buffer.slice(..));
        pass.set_index_buffer(index_buffer.slice(..), 0, IndexFormat::Uint32);
        pass.draw_indexed(0..6, 0, 0..prepared_sprite.count);

        RenderCommandResult::Success
    }
}
```

---

# Putting it all together

```rust [|4-6|8-10|11|13-18|20-27]
pub struct MyRenderPlugin;
impl Plugin for MyRenderPlugin {
    fn build(&self, app: &mut App) {
        let Ok(render_app) = app.get_sub_app_mut(RenderApp) else {
            return;
        };

        render_app
            .add_render_command::<Transparent2d, MyDrawCommand>()
            .init_resource::<SpecializedRenderPipelines<CustomPipeline>>()
            .add_systems(ExtractSchedule, extract)
            .add_systems(
                Render,
                (
                    queue.in_set(RenderSet::Queue),
                    prepare.in_set(RenderSet::PrepareBindGroups),
                ),
            );
    }
    fn finish(&self, app: &mut App) {
        let Ok(render_app) = app.get_sub_app_mut(RenderApp) else {
            return;
        };

        render_app.init_resource::<CustomPipeline>();
        render_app.init_resource::<FixedQuadMesh>();
    }
}
```

<!-- .element class="fragment" -->

---

## The shader

The Code that runs on the GPU

---

```wgsl
#import bevy_render::{ maths::affine_to_square, view::View, globals::Globals }

@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<uniform> globals: Globals;

@group(1) @binding(0) var texture: texture_2d<f32>;
@group(1) @binding(1) var texture_sampler: sampler;
```

<!-- .element class="fragment" -->

```wgsl
struct VertexInput{
    @builtin(vertex_index) index: u32,

	// vertex buffer
	@location(0) position : vec3<f32>,

	// instance buffer
    @location(1) i_translation: vec4<f32>,
    @location(2) i_rotation: vec4<f32>,
    @location(3) i_scale: vec4<f32>,
}
```

<!-- .element class="fragment" -->

```wgsl
struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
	@location(1) uv : vec2<f32>,
};
```

<!-- .element class="fragment" -->

---

## The Vertex Stage

```wgsl [|5-9|12|15|18|21-24|22]
@vertex
fn vertex(in: VertexInput) -> VertexOutput{
	var out : VertexOutput;

	let instance_transform = affine_to_square(mat3x4<f32>(
        in.i_translation,
        in.i_rotation,
        in.i_scale,
    ));

	// read the texture size
	let size = vec2<f32>(textureDimensions(texture));

	// some simple vertex animation
	let animation_scale = vec2(1., max(abs(sin(globals.time)), 0.2));

	// offset the vertex, so our quad center matches the transform
	let offset_position = in.position - vec3(0.5, 0.5, 0.);

	// multiple the vertex by the projection matrix and the instance transform
    out.clip_position =
		view.view_proj
		* instance_transform
		* vec4<f32>(offset_position * vec3(size * animation_scale,1.), 1.0);

	// inverse y axis for uv map
	out.uv = vec2(in.position.x, 1. - in.position.y);

	return out;
}
```

---

## The Fragment Stage

```wgsl
@fragment
fn fragment(in : VertexOutput) -> @location(0) vec4<f32> {
	return textureSample(texture, texture_sampler, in.uv);
}
```

---

```rust
fn setup(mut cmd: Commands, server: Res<AssetServer>){
    cmd.spawn(Camera2dBundle::default());
    cmd.spawn((
        SpatialBundle::default(),
        CustomSprite {
            texture: server.load("icon.png"),
        },
    ));
}
```

---

<div class="row">
    <video src="assets/example.webm" autoplay=true loop></video>
</div>

<br />

## Thanks for listing

[github.com/Lommix/bevy_pipeline_example]()
