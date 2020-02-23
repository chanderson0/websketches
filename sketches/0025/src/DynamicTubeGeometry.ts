import {
  BufferGeometry,
  Curve,
  Float32BufferAttribute,
  Geometry,
  Vector2,
  Vector3,
  Path,
  Triangle,
} from 'three';

export class DynamicTubeBufferGeometry extends BufferGeometry {
  parameters: {
    path: Curve<Vector3>;
    tubularSegments: number;
    radius: number | Curve<Vector2>;
    radiusSegments: number;
    closed: boolean;
    capped: boolean;
  };
  tangents: Vector3[];
  normals: Vector3[];
  binormals: Vector3[];

  startCap: BufferGeometry;
  endCap: BufferGeometry;

  constructor(
    path: Curve<Vector3>,
    tubularSegments = 64,
    radius: number | Curve<Vector2> = 1,
    radiusSegments = 8,
    closed = false,
    capped = false
  ) {
    super();

    this.type = 'TubeBufferGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radius,
      radiusSegments,
      closed,
      capped,
    };

    // Not in the Typescript? :(
    const frames = (path as any).computeFrenetFrames(tubularSegments, closed);

    // expose internals

    this.tangents = frames.tangents;
    this.normals = frames.normals;
    this.binormals = frames.binormals;

    // helper variables

    const vertex = new Vector3();
    const normal = new Vector3();
    const uv = new Vector2();
    let P = new Vector3();

    let i, j;

    // buffer

    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // functions

    const startVerts: Vector3[] = [];
    const endVerts: Vector3[] = [];

    function generateSegment(i: number): void {
      // we use getPointAt to sample evenly distributed points from the given path

      P = path.getPointAt(i / tubularSegments, P);
      let P1: Vector3 | undefined;
      let P2: Vector3 | undefined;

      // retrieve corresponding normal and binormal

      const T = frames.tangents[i];
      const N = frames.normals[i];
      const B = frames.binormals[i];

      // generate normals and vertices for the current segment

      for (j = 0; j <= radiusSegments; j++) {
        const v = (j / radiusSegments) * Math.PI * 2;

        const sin = Math.sin(v);
        const cos = -Math.cos(v);

        // normal

        normal.x = cos * N.x + sin * B.x;
        normal.y = cos * N.y + sin * B.y;
        normal.z = cos * N.z + sin * B.z;
        normal.normalize();

        // vertex

        const r = radius instanceof Curve ? radius.getPointAt(i / tubularSegments).y : radius;
        vertex.x = P.x + r * normal.x;
        vertex.y = P.y + r * normal.y;
        vertex.z = P.z + r * normal.z;

        vertices.push(vertex.x, vertex.y, vertex.z);

        if (i === 0) {
          startVerts.push(vertex.clone());
        } else if (i === tubularSegments - 1) {
          endVerts.push(vertex.clone());
        }

        // adjust normals if the radius is a Path

        if (radius instanceof Curve) {
          let delta = 0.0001;
          let t1 = i / tubularSegments - delta;
          let t2 = i / tubularSegments + delta;

          // Capping in case of danger

          if (t1 < 0) t1 = 0;
          if (t2 > 1) t2 = 1;

          P1 = path.getPointAt(t1, P1);
          P2 = path.getPointAt(t2, P2);
          delta = P1.distanceTo(P2);

          const r1 = radius.getPointAt(t1).y;
          const r2 = radius.getPointAt(t2).y;

          normal.addScaledVector(T, -(r2 - r1) / delta).normalize();
        }
        normals.push(normal.x, normal.y, normal.z);
      }
    }

    function generateIndices(): void {
      for (j = 1; j <= tubularSegments; j++) {
        for (i = 1; i <= radiusSegments; i++) {
          const a = (radiusSegments + 1) * (j - 1) + (i - 1);
          const b = (radiusSegments + 1) * j + (i - 1);
          const c = (radiusSegments + 1) * j + i;
          const d = (radiusSegments + 1) * (j - 1) + i;

          // faces

          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
    }

    function generateUVs(): void {
      for (i = 0; i <= tubularSegments; i++) {
        for (j = 0; j <= radiusSegments; j++) {
          uv.x = i / tubularSegments;
          uv.y = j / radiusSegments;

          uvs.push(uv.x, uv.y);
        }
      }
    }

    const buildCap = (verts: Vector3[], center: Vector3): BufferGeometry => {
      const pointsGeom = new BufferGeometry().setFromPoints([center, ...verts]);
      const pgPos = pointsGeom.attributes.position;
      const index = [];
      for (let i = 1; i < pgPos.count - 1; i++) {
        index.push(0, i, i + 1);
      }
      pointsGeom.setIndex(index);
      return pointsGeom;
    };

    function generateBufferData(): void {
      for (i = 0; i < tubularSegments; i++) {
        generateSegment(i);
      }

      // if the geometry is not closed, generate the last row of vertices and normals
      // at the regular position on the given path
      //
      // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)

      generateSegment(closed === false ? tubularSegments : 0);

      // uvs are generated in a separate function.
      // this makes it easy compute correct values for closed geometries

      generateUVs();

      // finally create faces

      generateIndices();
    }

    // create buffer data

    generateBufferData();

    // build geometry

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

    this.startCap = buildCap(startVerts, path.getPointAt(0));
    this.endCap = buildCap(endVerts, path.getPointAt(1));
  }

  toJSON(): object {
    const data = super.toJSON();
    data.path = (this.parameters.path as any).toJSON();
    return data;
  }
}

export class DynamicTubeGeometry extends Geometry {
  parameters: {
    path: Curve<Vector3>;
    tubularSegments: number;
    radius: number | Curve<Vector2>;
    radiusSegments: number;
    closed: boolean;
    capped: boolean;
  };
  tangents: Vector3[];
  normals: Vector3[];
  binormals: Vector3[];

  constructor(
    path: Curve<Vector3>,
    tubularSegments = 64,
    radius: number | Curve<Vector2> = 1,
    radiusSegments = 8,
    closed = false,
    capped = false
  ) {
    super();

    this.type = 'TubeGeometry';

    this.parameters = {
      path,
      tubularSegments,
      radius,
      radiusSegments,
      closed,
      capped,
    };

    const bufferGeometry = new DynamicTubeBufferGeometry(
      path,
      tubularSegments,
      radius,
      radiusSegments,
      closed,
      capped
    );

    // expose internals

    this.tangents = bufferGeometry.tangents;
    this.normals = bufferGeometry.normals;
    this.binormals = bufferGeometry.binormals;

    // create geometry

    this.fromBufferGeometry(bufferGeometry);
    this.mergeVertices();
  }
}
