import Phaser from "phaser";
import { sceneEvents } from "../events/EventCenter";
import type WebWorkerClient from '../zk/WebWorkerClient'


export default class GameUI extends Phaser.Scene {
  scoreText!: Phaser.GameObjects.Text;
  itemsText!: Phaser.GameObjects.Text;
  // saveButton!: Phaser.GameObjects.Text;
  displayAccount!: string;
  zkappWorkerClient!: WebWorkerClient;
  toast!: any;

  constructor() {
    super({ key: "game-ui" });
  }

  async init() {
    this.add.text(20, 30, this.displayAccount, {
      fontStyle: "bold",
      backgroundColor: "white",
      fontSize: 20,
      color: "green",
    });

    //Create proofs button
    const proofsButton = this.add.text(20, 180, 'Proofs')
      .setPadding(10)
      .setStyle({ backgroundColor: '#111' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.onProofs, this)
      .on('pointerover', () => proofsButton.setStyle({ fill: '#f39c12' }))
      .on('pointerout', () => proofsButton.setStyle({ fill: '#FFF' }))

    //Create proofs button
    const CampaignButton = this.add.text(20, 220, 'Campaign')
      .setPadding(10)
      .setStyle({ backgroundColor: '#111' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.onCampaign, this)
      .on('pointerover', () => CampaignButton.setStyle({ fill: '#f39c12' }))
      .on('pointerout', () => CampaignButton.setStyle({ fill: '#FFF' }))

  }



  async create() {
    sceneEvents.once("coin-collected", this.createSaveButton, this);
    sceneEvents.on("coin-collected", this.handleCoinCollection, this);
    sceneEvents.on("sword-case-collide", () => {
      this.toast.showMessage("Please press P to collect sword")
    }, this);

    sceneEvents.once("sword-acquired", () => {
      this.sound.playAudioSprite("sfx", "alien death");
      this.toast.showMessage("Please press X to attack")
    }, this);

    // on Chain Score
    this.scoreText = this.add.text(20, 50, `Score: <fetching>`, {
      fontSize: 25,
      fontFamily: "Roboto",
      color: "black",
    });

    //collected Items
    this.itemsText = this.add.text(20, 80, `Items: <fetching>`, {
      fontSize: 20,
      fontFamily: "Roboto",
      backgroundColor: "white",
      color: "black",
    });

    //@ts-ignore
    this.toast = this.rexUI.add.toast({
      x: this.cameras.main.centerX,
      y: this.cameras.main.centerY + 500,
      //@ts-ignore
      background: this.rexUI.add.roundRectangle(0, 0, 2, 2, 20, 0x1565c0),
      text: this.add.text(0, 0, '', {
        fontSize: '14px'
      }),
      duration: {
        in: 200,
        hold: 3200,
        out: 200,
      },
      space: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },
    })

    this.refreshStats()

  }
  onCampaign() {
    const scene = this;
    var config = {
      //@ts-ignore
      background: scene.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),
      //@ts-ignore
      title: scene.rexUI.add.label({
        //@ts-ignore
        background: scene.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: scene.add.text(0, 0, 'Campaign', {
          fontSize: '1.5rem',
          align: "center"
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10
        }
      }),

      content: scene.add.text(0, 0, `Mission 1 \n
      1. Collect sword\n
      2. Kill Evil Minion\n
      3. Stand on Magic Carpet`, {
        fontSize: '1rem'
      }),

      actions: [
      ],

      space: {
        title: 25,
        content: 25,
        action: 15,

        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },

      align: {
        actions: 'center', // 'center'|'left'|'right'
      },

      expand: {
        content: false,  // Content is a pure text object
      }
    }

    //@ts-ignore
    var dialog = scene.rexUI.add.dialog(config).setPosition(this.cameras.main.centerX, this.cameras.main.centerY)
      .layout()
      .modalPromise({
        defaultBehavior: false,
        // manaulClose: false,
        anyTouchClose: true,
        duration: {
          in: 500,
          out: 500
        }
      })
      .then(function (data: any) {
        // print.text += `${JSON.stringify(data)}\n`;
      })


  }
  async onProofs() {

    const dialog = await this.CreateDialog(this)

    dialog.setPosition(1000, 300)
      .layout()
      .modalPromise({
        defaultBehavior: false,
        manaulClose: true,
        duration: {
          in: 500,
          out: 500
        }
      })

  }

  async fetchProofText() {
    const { proofs } = await this.zkappWorkerClient.getProofs()

    let content = `Root                   Url                     Status     Date\n`;
    for (let i = 0; i < proofs.length; i++) {
      let root = `${proofs[i].root.substring(0, 4)}...${proofs[i].root.substring(proofs[i].root.length - 4, proofs[i].root.length)}`;
      content = content + `${root}      ${proofs[i].fileUrl}   ${proofs[i].status}   ${proofs[i].updatedAt}\n`;
    }

    return content
  }

  async requestProof() {
    const { message } = await this.zkappWorkerClient.requestProof()

    this.toast.showMessage(message)
  }

  async CreateDialog(scene: any) {
    const content = await this.fetchProofText();
    var dialog = scene.rexUI.add.dialog({
      background: scene.rexUI.add.roundRectangle(0, 0, 100, 100, 20, 0x1565c0),

      title: scene.rexUI.add.label({
        background: scene.rexUI.add.roundRectangle(0, 0, 100, 40, 20, 0x003c8f),
        text: scene.add.text(0, 0, 'Proofs', {
          fontSize: '24px'
        }),
        space: {
          left: 15,
          right: 15,
          top: 10,
          bottom: 10
        }
      }),

      content: scene.add.text(0, 0, content, {
        fontSize: '24px'
      }),

      actions: [
        this.CreateLabel(scene, 'Request Proof'),
        this.CreateLabel(scene, 'Close')

      ],

      space: {
        title: 25,
        content: 25,
        action: 15,

        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },

      align: {
        actions: 'right', // 'center'|'left'|'right'
      },

      expand: {
        content: false,  // Content is a pure text object
      }
    })
      //@ts-ignore
      .on('button.click', async (button, groupName, index, pointer, event) => {
        console.log(`button index ${index}`)

        if (index == 1) {
          //Close button clicked
          dialog.modalClose(null)
        }

        if (index == 0) {
          await this.requestProof();
        }

        // button.getElement('background').setStrokeStyle(1, 0xffffff);
      })
      .on('button.over', function (button: any) {
        button.getElement('background').setStrokeStyle(1, 0xffffff);
      })
      .on('button.out', function (button: any) {
        button.getElement('background').setStrokeStyle();
      });

    return dialog;
  }

  CreateLabel(scene: any, text: string) {
    return scene.rexUI.add.label({
      // width: 40,
      // height: 40,

      background: scene.rexUI.add.roundRectangle(0, 0, 0, 0, 20, 0x5e92f3),

      text: scene.add.text(0, 0, text, {
        fontSize: '24px'
      }),

      space: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    });
  }


  createSaveButton() {
    const saveButton = this.add.text(20, 150, 'Save')
      .setPadding(10)
      .setStyle({ backgroundColor: '#111' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', this.onSave, this)
      .on('pointerover', () => saveButton.setStyle({ fill: '#f39c12' }))
      .on('pointerout', () => saveButton.setStyle({ fill: '#FFF' }))
  }

  async onSave() {
    //ToDo. clean and modularise
    const gameScene = this.scene.get("game")
    //@ts-ignore
    const items = gameScene?.playerZk.myChests;


    // if (import.meta.env.PROD) {
    for (let i = 0; i < items.length; i++) {
      await this.zkappWorkerClient.foundItem({ point: { x: items[i].x, y: items[i].y, key: items[i].key } });
    }
    // }
    await this.zkappWorkerClient.commitTreasure(items)

    //@ts-ignore
    gameScene?.playerZk.clear()

    this.refreshStats()

  }

  async refreshStats() {
    const gameScene = this.scene.get("game")
    //@ts-ignore
    const itemsCount = gameScene?.playerZk.myChests.length;
    const score = await this.zkappWorkerClient.getScore()

    this.scoreText.setText(`Score: ${score}`);
    this.itemsText.setText(`Items: ${itemsCount}`)
  }

  handleCoinCollection() {
    console.count("Item No.")
    this.sound.playAudioSprite("sfx", "ping");
    this.refreshStats()
  }


}
