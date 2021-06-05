/**
 * @author Abhishek Pathak <abhi.pathak401@gmail.com>
 */

import {BoxBufferGeometry, BoxHelper, Mesh, MeshPhysicalMaterial, Object3D, Quaternion, Scene,  SphereGeometry, Vector3, WebGLCubeRenderTarget} from "three";
import EditorNodeMixin from "./EditorNodeMixin";
import { envmapPhysicalParsReplace, worldposReplace } from "./helper/BPCEMShader";
import CubemapCapturer from "./helper/CubemapCapturer";


export enum ReflectionProbeTypes{
    "Realtime","Baked"
}

export enum ReflectionProbeRefreshTypes{
    "OnAwake","EveryFrame"
}

export type ReflectionProbeSettings={
    probePosition:Vector3,
    probePositionOffset:Vector3,
    probeScale:Vector3,
    reflectionType:ReflectionProbeTypes,
    intensity:number,
    resolution:number,
    refreshMode:ReflectionProbeRefreshTypes,
    lookupName:string
}



export default class ReflectionProbeNode extends EditorNodeMixin(Object3D){
    static nodeName="Reflection Probe";
    static legacyComponentName = "reflectionprobe";
    static haveStaticTags=false
    gizmo:BoxHelper;
    reflectionProbeSettings:ReflectionProbeSettings;
    centerBall:any;
    currentEnvMap:WebGLCubeRenderTarget;

    constructor(editor){
        super(editor);
        this.centerBall=new Mesh(new SphereGeometry(0.75));
        this.add(this.centerBall);
        this.reflectionProbeSettings={
            probePosition:this.position,
            probePositionOffset:new Vector3(0),
            probeScale:new Vector3(1,1,1),
            reflectionType:ReflectionProbeTypes.Baked,
            intensity:1,
            resolution:512,
            refreshMode:ReflectionProbeRefreshTypes.OnAwake,
            lookupName:"EnvMap",
        }
        this.gizmo=new BoxHelper(new Mesh(new BoxBufferGeometry()),0xff0000);
        this.centerBall.material=new MeshPhysicalMaterial({
            roughness:0,metalness:1,
        })

        this.add(this.gizmo);

    }


    captureCubeMap(){
        const sceneToBake=this.getSceneForBaking(this.editor.scene);
        const cubemapCapturer=new CubemapCapturer(this.editor.renderer.renderer,sceneToBake,this.reflectionProbeSettings.resolution,this.reflectionProbeSettings.reflectionType==1);
        this.currentEnvMap=cubemapCapturer.update(this.position,this.reflectionProbeSettings.lookupName);
        this.injectShader();
    }

    Bake=()=>{
        this.captureCubeMap();
    }

    onChange(){

        this.gizmo.matrix.compose(this.reflectionProbeSettings.probePositionOffset,new Quaternion(0),this.reflectionProbeSettings.probeScale);
        this.editor.scene.traverse(child=>{
            if(child.material)
                child.material.envMapIntensity=this.reflectionProbeSettings.intensity;
        });
        this.editor.scene.environment=this.visible?this.currentEnvMap?.texture:null;

    }
    injectShader(){
        this.editor.scene.traverse(child=>{
            if(child.material){
                child.material.onBeforeCompile = function ( shader ) {
                    shader.uniforms.cubeMapSize={value: this.reflectionProbeSettings.probeScale}
                    shader.uniforms.cubeMapPos={value: this.reflectionProbeSettings.probePositionOffset}
                    shader.vertexShader = 'varying vec3 vWorldPosition;\n' + shader.vertexShader;
                    shader.vertexShader = shader.vertexShader.replace(
                        '#include <worldpos_vertex>',
                        worldposReplace
                    );
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <envmap_physical_pars_fragment>',
                        envmapPhysicalParsReplace
                    );
                }.bind(this);
              }
        });
    }


    serialize(){
        let data:any={}
        this.reflectionProbeSettings.probePosition=this.position;
        data={
            options:this.reflectionProbeSettings
        };
        return super.serialize({reflectionprobe:data});
    }

    static async deserialize(editor, json){
        const node=await super.deserialize(editor,json);
        const reflectionOptions = json.components.find(c => c.name === "reflectionprobe");
        const {options}=reflectionOptions.props;
        node.reflectionProbeSettings=options??node.reflectionProbeSettings;
        return node;
    }

    prepareForExport() {
        super.prepareForExport();
        this.reflectionProbeSettings.probePosition=this.position;
        this.addGLTFComponent("reflectionprobe", {
                options:this.reflectionProbeSettings
        });
        this.replaceObject();
    }

    getSceneForBaking(scene:Scene){
        const sceneToBake=new Scene();
        scene.traverse(obj=>{
            if(obj["reflectionProbeStatic"]){
                const o=obj.clone();
                o.traverse(child=>{
                    //disable specular highlights
                    (child as any).material&&((child as any).material.roughness=1);
                });
                sceneToBake.add(o);

            }
        });
        return sceneToBake;
    }
}