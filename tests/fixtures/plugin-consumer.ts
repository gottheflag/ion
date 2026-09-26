import {
	Component
} from "../../src/index.js";

import {
	Plugin
} from "../../src/plugin/index.js";

class TestPlugin extends Plugin {}

export class PluginConsumer
	extends Component {}

PluginConsumer.use(TestPlugin);