import { Config, nodes, Tag, Node } from '@markdoc/markdoc';

// Custom tag definitions
const callout = {
  render: 'Callout',
  attributes: {
    type: {
      type: String,
      default: 'note',
      matches: ['note', 'warning', 'tip', 'danger'],
    },
    title: {
      type: String,
    },
  },
};

const tabs = {
  render: 'Tabs',
  attributes: {
    items: {
      type: Array,
      required: true,
    },
  },
  transform(node: Node, config: Config) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);
    return new Tag(this.render, attributes, children);
  },
};

const tab = {
  render: 'Tab',
  attributes: {
    label: {
      type: String,
      required: true,
    },
  },
};

const codeBlock = {
  render: 'CodeBlock',
  attributes: {
    language: {
      type: String,
      default: 'text',
    },
    title: {
      type: String,
    },
    showLineNumbers: {
      type: Boolean,
      default: false,
    },
  },
};

const apiCodeBlock = {
  render: 'ApiCodeBlock',
  attributes: {
    endpoint: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      default: 'GET',
    },
    title: {
      type: String,
    },
  },
};

const sequenceDiagram = {
  render: 'SequenceDiagram',
  attributes: {
    title: {
      type: String,
      required: true,
    },
    participants: {
      type: Array,
      required: true,
    },
    steps: {
      type: Array,
      required: true,
    },
  },
};

const integrationFlowDiagram = {
  render: 'IntegrationFlowDiagram',
  selfClosing: true,
};

export const config: Config = {
  nodes: {
    ...nodes,
    fence: {
      render: 'CodeBlock',
      attributes: {
        language: {
          type: String,
        },
        content: {
          type: String,
        },
      },
    },
  },
  tags: {
    callout,
    tabs,
    tab,
    codeBlock,
    apiCodeBlock,
    sequenceDiagram,
    'integration-flow': integrationFlowDiagram,
  },
};
